"use client";

/**
 * ROLETA VISIT BRAGA - PASSAGEM DE ELEVAÇÃO PREMIUM
 * ---------------------------------------------------
 * MATERIALIDADE com luz única (topo-esquerda) a comandar tudo:
 * - aro com bisel em 3 camadas (highlight na orla exposta à luz,
 *   sombra na orla oposta) e rampa de vermelho iluminada a 135°
 * - disco das fatias ENCASTRADO no aro: sombra interior + varredura
 *   de luz coerente sobre as fatias
 * - fatias com gradiente radial (centro ligeiramente mais claro) e
 *   separadores com hairline dupla (sombra + highlight)
 * - cubo em medalhão com bisel e sombra de contacto sobre as fatias
 * - o ponteiro projeta sombra REAL sobre a roda (deslocada para
 *   baixo-direita, como manda a luz)
 * - texto das fatias AUTO-AJUSTADO ao comprimento (nunca atropela,
 *   em PT/ES/EN, mesmo com nomes compridos)
 * - vitória encenada em 3 tempos: parar → suspense (~350 ms) → explosão
 *
 * LÓGICA INTACTA: sorteio ponderado, reserva por transação, stock
 * visível congelado, física 5–7 voltas, sons sintetizados.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PREMIOS, stockInicial, type Premio } from "@/lib/premios";
import {
  subscreverStock,
  reservarPremio,
  registarGiro,
  type Stock,
} from "@/lib/stock";
import { FACTOS } from "@/lib/factos";
import { PERGUNTA_ORIGEM, MOSTRAR_REGRA } from "@/lib/config";
import { t, type Idioma } from "@/lib/i18n";
import { tique, pouso, repique, consolo, vibrar, iniciarAudio } from "@/lib/audio";
import CartaoResultado from "./CartaoResultado";
import PerguntaOrigem from "./PerguntaOrigem";
import Portal from "./Portal";

const N = PREMIOS.length;
const SEG = 360 / N;
const C = 220; // centro do viewBox
const R = 154; // raio das fatias

/**
 * TIPOGRAFIA DA RODA - nenhuma legenda pode aparecer invertida
 * -------------------------------------------------------------
 * O texto é TANGENCIAL (perpendicular ao raio) e as fatias da metade
 * inferior levam +180°, o que as põe a direito. Resultado: as oito legendas
 * leem-se todas, em qualquer posição da roda - era este o tell nº1 de
 * roleta amadora (no telemóvel via-se "PEGATINA BRACVS" ao contrário).
 *
 * O corpo da letra é calculado contra a CORDA disponível na fatia, e é o
 * ESPANHOL que manda: é ~20% mais longo que o português. Dimensionar pelo
 * PT era exactamente o que rebentava o layout em ES.
 */
const RT = 112; // raio onde assenta o bloco de texto
const CORDA = 2 * RT * Math.sin(Math.PI / N) * 0.86; // pista útil

function corpo(texto: string, maximo: number, largura: number): number {
  const cabe = CORDA / (Math.max(1, texto.length) * largura);
  // arredondar para BAIXO: para cima, o espanhol transbordava por décimas
  return Math.max(7, Math.min(maximo, Math.floor(cabe * 10) / 10));
}

/** ponto na circunferência para um ângulo (0° = topo, sentido horário) */
function ponto(angulo: number, raio: number): [number, number] {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return [C + raio * Math.cos(rad), C + raio * Math.sin(rad)];
}

function caminhoFatia(i: number) {
  const [x0, y0] = ponto(i * SEG, R);
  const [x1, y1] = ponto((i + 1) * SEG, R);
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
}

/** linha zigzag fina no anel branco - o escadório como detalhe maquinado */
const ZIGZAG = (() => {
  const passos = 48;
  const partes: string[] = [];
  for (let k = 0; k <= passos; k++) {
    const raio = k % 2 === 0 ? R + 15 : R + 24;
    const [x, y] = ponto((k * 360) / passos, raio);
    partes.push(`${k === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return partes.join(" ") + " Z";
})();


function disponivel(p: Premio, stock: Stock): boolean {
  const s = stock[p.id];
  return s === null || s === undefined || s > 0;
}

function sortearPremio(stock: Stock, excluir: Set<string>): number {
  const candidatos = PREMIOS.map((p, i) => ({ p, i })).filter(
    ({ p }) => disponivel(p, stock) && !excluir.has(p.id)
  );
  if (candidatos.length === 0) {
    const semPremio = PREMIOS.findIndex((p) => !p.ganha);
    return semPremio >= 0 ? semPremio : 0;
  }
  const total = candidatos.reduce((s, c) => s + c.p.peso, 0);
  let alvo = Math.random() * total;
  for (const c of candidatos) {
    alvo -= c.p.peso;
    if (alvo <= 0) return c.i;
  }
  return candidatos[candidatos.length - 1].i;
}

const easeOutQuart = (te: number) => 1 - Math.pow(1 - te, 4);

type Props = {
  idioma: Idioma;
  montra: boolean;
  onOcupadaChange: (ocupada: boolean) => void;
  /** cada fase do giro: a mascote e a iluminação reagem a isto */
  onFase: (f: "repouso" | "giro" | "suspense" | "vitoria" | "derrota") => void;
};

export default function Roleta({
  idioma,
  montra,
  onOcupadaChange,
  onFase,
}: Props) {
  /* O ângulo NÃO vive em estado React: a 60 fps, um setState por frame
     obrigaria a re-renderizar 8 fatias + 16 textos + separadores e faz
     o giro gaguejar em tablets medianos. Guardamos o ângulo num ref e
     escrevemos o transform diretamente no <g> - o React só volta a
     trabalhar quando algo REAL muda (giro terminou, resultado, stock). */
  const anguloRef = useRef(0);
  const fatiasRef = useRef<SVGGElement | null>(null);
  const [aGirar, setAGirar] = useState(false);
  const [resultado, setResultado] = useState<Premio | null>(null);
  const [facto, setFacto] = useState<number>(-1);
  const [pedirOrigem, setPedirOrigem] = useState(false);
  const [stockVisivel, setStockVisivel] = useState<Stock>(stockInicial);
  const stockRef = useRef<Stock>(stockInicial());
  const aGirarRef = useRef(false);
  const rafRef = useRef<number>(0);
  const suspenseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sinoRef = useRef<SVGGElement | null>(null);
  const ponteiroRef = useRef<SVGSVGElement | null>(null);
  const envolventeRef = useRef<HTMLDivElement | null>(null);
  const [vencedora, setVencedora] = useState(-1);

  /** escreve a rotação diretamente no DOM (sem passar pelo React) */
  const aplicarAngulo = useCallback((graus: number) => {
    anguloRef.current = graus;
    const g = fatiasRef.current;
    if (g) g.style.transform = `rotate(${graus}deg)`;
  }, []);

  useEffect(() => {
    const cancelar = subscreverStock((s) => {
      stockRef.current = s;
      if (!aGirarRef.current) setStockVisivel(s);
    });
    return () => {
      cancelar();
      cancelAnimationFrame(rafRef.current);
      if (suspenseRef.current) clearTimeout(suspenseRef.current);
    };
  }, []);

  useEffect(() => {
    onOcupadaChange(aGirar || resultado !== null || pedirOrigem);
  }, [aGirar, resultado, pedirOrigem, onOcupadaChange]);

  /* a mascote e a iluminação reagem a cada fase */
  useEffect(() => {
    if (aGirar) onFase("giro");
    else if (resultado) onFase(resultado.ganha ? "vitoria" : "derrota");
    else onFase("repouso");
  }, [aGirar, resultado, onFase]);


  const balancarSino = useCallback(() => {
    const el = sinoRef.current;
    if (!el || typeof el.animate !== "function") return;
    try {
      el.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-13deg)" },
          { transform: "rotate(7deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 260, easing: "ease-out" }
      );
    } catch {
      /* opcional */
    }
  }, []);

  /* ------------------------------ GIRO ------------------------------ */
  const executarGiro = useCallback(async () => {
    if (aGirarRef.current) return;
    setResultado(null);
    setAGirar(true);
    aGirarRef.current = true;
    setFacto(Math.floor(Math.random() * FACTOS.length));

    let vencedor = -1;
    const excluir = new Set<string>();
    for (let tentativa = 0; tentativa < N + 1; tentativa++) {
      const i = sortearPremio(stockRef.current, excluir);
      const ok = await reservarPremio(PREMIOS[i].id);
      if (ok) {
        vencedor = i;
        break;
      }
      excluir.add(PREMIOS[i].id);
    }
    if (vencedor < 0) {
      vencedor = Math.max(
        0,
        PREMIOS.findIndex((p) => !p.ganha)
      );
    }

    const centroFatia = vencedor * SEG + SEG / 2;
    const jitter = (Math.random() - 0.5) * (SEG - 12);
    const alvoBase = (360 - centroFatia + jitter + 360) % 360;

    const inicio = anguloRef.current;
    const atualNorm = ((inicio % 360) + 360) % 360;
    const voltas = 5 + Math.floor(Math.random() * 3);
    const delta = voltas * 360 + ((alvoBase - atualNorm + 360) % 360);
    const duracao = 5400 + Math.random() * 900;

    /* ═══ ENCENAÇÃO EM 7 TEMPOS ═══
       1. ANTECIPAÇÃO: a roda RECUA 5° antes de arrancar - como um braço a
          armar o golpe. É o detalhe que dá peso ao gesto.
       2. aceleração com desfoque de movimento nas fatias
       3. zoom de câmara nos últimos 2 s
       4. desaceleração com tiques FÍSICOS: o ponteiro bate e vibra
       5. paragem → suspense
       6. badalada + confetes + bilhete
       7. a mascote acompanha cada fase (ver Bracvs.tsx) */
    const ANTECIPACAO = 300;
    const RECUO = 5;

    const t0 = performance.now();
    let ultimaFatia = Math.floor(atualNorm / SEG);

    const passo = (agora: number) => {
      const decorrido = agora - t0;

      // 1. antecipação: recua 5° e volta, antes de disparar
      if (decorrido < ANTECIPACAO) {
        const a = decorrido / ANTECIPACAO;
        aplicarAngulo(inicio - RECUO * Math.sin(a * Math.PI));
        rafRef.current = requestAnimationFrame(passo);
        return;
      }

      const te = Math.min(1, (decorrido - ANTECIPACAO) / duracao);
      const atual = inicio + delta * easeOutQuart(te);
      aplicarAngulo(atual);

      // 2. desfoque de movimento proporcional à velocidade angular
      const velocidade = (1 - te) ** 3; // 1 → 0
      const disco = fatiasRef.current;
      if (disco) {
        disco.style.filter =
          velocidade > 0.06 ? `blur(${(velocidade * 2.6).toFixed(2)}px)` : "none";
      }

      // 3. zoom de câmara nos últimos 2 s (a roda "aproxima-se")
      const env = envolventeRef.current;
      if (env) {
        const restante = (1 - te) * duracao;
        const zoom = restante < 2000 ? 1 + (1 - restante / 2000) * 0.05 : 1;
        env.style.transform = `scale(${zoom.toFixed(4)})`;
      }

      const fatia = Math.floor((((atual % 360) + 360) % 360) / SEG);
      if (fatia !== ultimaFatia) {
        ultimaFatia = fatia;
        // 4. tique físico: som + badalo do sino + vibração real do ponteiro
        tique(te);
        balancarSino();
        const pt = ponteiroRef.current;
        if (pt && typeof pt.animate === "function") {
          try {
            pt.animate(
              [
                { transform: "translateX(-50%) rotate(0deg)" },
                { transform: "translateX(-50%) rotate(6deg)" },
                { transform: "translateX(-50%) rotate(-2deg)" },
                { transform: "translateX(-50%) rotate(0deg)" },
              ],
              { duration: 170, easing: "ease-out" }
            );
          } catch {}
        }
        if (te > 0.82) vibrar(8); // só na reta final, para não irritar
      }

      if (te < 1) {
        rafRef.current = requestAnimationFrame(passo);
      } else {
        /* 5. PARAGEM: limpa desfoque e zoom, a roda assenta */
        const disco2 = fatiasRef.current;
        if (disco2) disco2.style.filter = "none";
        const env2 = envolventeRef.current;
        if (env2) env2.style.transform = "scale(1)";

        pouso();
        vibrar(30);
        setAGirar(false);
        setFacto(-1);
        setStockVisivel({ ...stockRef.current }); // só agora a fatia apaga
        setVencedora(vencedor);                   // halo a pulsar
        onFase("suspense");                       // tudo congela

        const premio = PREMIOS[vencedor];
        registarGiro(premio.ganha); // alimenta o relatório da feira

        /* 6. SUSPENSE de ~500 ms e só então a revelação */
        suspenseRef.current = setTimeout(() => {
          aGirarRef.current = false;
          if (premio.ganha) repique();
          else consolo();
          setResultado(premio);
        }, premio.ganha ? 500 : 320);
      }
    };

    rafRef.current = requestAnimationFrame(passo);
  }, [aplicarAngulo, balancarSino, onFase]);

  /* A PÁGINA é dona do botão (para a mascote poder viver entre a roda e a
     ação, sem sobreposições). Pede o giro por evento: menos acoplamento. */
  useEffect(() => {
    const pedido = () => {
      if (aGirarRef.current || resultado) return;
      iniciarAudio(); // política dos browsers: só depois de um toque
      if (PERGUNTA_ORIGEM) setPedirOrigem(true);
      else executarGiro();
    };
    window.addEventListener("roda:girar", pedido);
    return () => window.removeEventListener("roda:girar", pedido);
  }, [resultado, executarGiro]);

  const fecharResultado = useCallback(() => {
    setResultado(null);
    setVencedora(-1);
  }, []);

  const emRepouso = !aGirar && !montra && !resultado;

  /* ----------------------------- DESENHO ----------------------------- */
  return (
    <section className="palco">
      <div
        ref={envolventeRef}
        className={`roda-envolvente${montra ? " roda-montra" : ""}`}
      >
        <svg
          className={`roda-svg${emRepouso ? " roda-repouso" : ""}`}
          viewBox="0 0 440 440"
          role="img"
          aria-label={t("titulo", idioma)}
        >
          <defs>
            {/* LUZ ÚNICA: topo-esquerda (135°). Todos os gradientes,
                biséis e sombras deste ficheiro obedecem-lhe. */}
            <linearGradient id="aroLuz" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff2318" />
              <stop offset="55%" stopColor="#e60009" />
              <stop offset="100%" stopColor="#b90006" />
            </linearGradient>
            <linearGradient id="biselClaro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id="biselEscuro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(90,0,3,0)" />
              <stop offset="55%" stopColor="rgba(90,0,3,0.15)" />
              <stop offset="100%" stopColor="rgba(90,0,3,0.55)" />
            </linearGradient>
            <linearGradient id="pratoBranco" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1ece2" />
            </linearGradient>
            {/* fatias: gradiente RADIAL (centro mais claro = volume) */}
            <radialGradient id="fatiaVermelha" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ff1e13" />
              <stop offset="68%" stopColor="#f2000a" />
              <stop offset="100%" stopColor="#d40008" />
            </radialGradient>
            {/* prémio-herói: vermelho profundo e vivo, distinto das
                fatias normais - é o que cria fila no stand */}
            <radialGradient id="fatiaHeroi" cx="0.5" cy="0.5" r="0.62">
              <stop offset="0%" stopColor="#ff3a1e" />
              <stop offset="62%" stopColor="#d20009" />
              <stop offset="100%" stopColor="#9d0006" />
            </radialGradient>
            <radialGradient id="fatiaBranca" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="72%" stopColor="#fbf8f2" />
              <stop offset="100%" stopColor="#efe9de" />
            </radialGradient>
            {/* varredura de luz coerente sobre o disco */}
            <linearGradient id="luzDisco" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(26,26,28,0.07)" />
            </linearGradient>
            {/* encastre do disco no aro */}
            <radialGradient id="sombraInterior" cx="0.5" cy="0.5" r="0.5">
              <stop offset="82%" stopColor="rgba(0,0,0,0)" />
              <stop offset="95%" stopColor="rgba(0,0,0,0.09)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.17)" />
            </radialGradient>
            <linearGradient id="cuboLuz" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#efeadf" />
            </linearGradient>
            <filter id="desfoque3" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <path
              id="arcoCubo"
              d={`M ${C} ${C} m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0`}
            />
          </defs>

          {/* prato base */}
          <circle cx={C} cy={C} r={R + 46} fill="url(#pratoBranco)" />

          {/* ARO COM BISEL (3 camadas): banda iluminada + orla clara
              virada à luz + orla escura oposta */}
          <circle
            cx={C}
            cy={C}
            r={R + 39}
            fill="none"
            stroke="url(#aroLuz)"
            strokeWidth="13"
          />
          <circle
            cx={C}
            cy={C}
            r={R + 45.5}
            fill="none"
            stroke="url(#biselClaro)"
            strokeWidth="1.6"
          />
          <circle
            cx={C}
            cy={C}
            r={R + 32.5}
            fill="none"
            stroke="url(#biselEscuro)"
            strokeWidth="1.6"
          />

          {/* linha zigzag maquinada + pontos de precisão */}
          <path
            d={ZIGZAG}
            fill="none"
            stroke="#e60009"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className={aGirar ? "zigzag-anel a-pulsar" : "zigzag-anel"}
          />
          {Array.from({ length: N }, (_, i) => {
            const [x, y] = ponto(i * SEG, R + 28.5);
            return (
              <circle key={"pt" + i} cx={x} cy={y} r="2.2" fill="#d40008" />
            );
          })}

          {/* fatias (rodam) com separadores em hairline dupla */}
          <g
            ref={fatiasRef}
            style={{
              transform: `rotate(${anguloRef.current}deg)`,
              transformOrigin: `${C}px ${C}px`,
            }}
          >
            {PREMIOS.map((p, i) => {
              const esgotado = !disponivel(p, stockVisivel);
              const heroi = p.destaque === true && !esgotado;
              const vermelha = i % 2 === 0;
              const mid = i * SEG + SEG / 2;
              const fs1 = corpo(p.linha1[idioma], 15, 0.66);
              const fs2 = p.linha2 ? corpo(p.linha2[idioma], 11.5, 0.62) : 0;

              /* metade inferior (90°–270°): +180° para o texto ficar a
                 direito. As linhas trocam de posição antes da rotação, para
                 que depois de rodadas fiquem pela ordem certa. */
              const virar = mid > 90 && mid < 270;
              const yc = C - RT;
              const y1 = virar ? yc + 6 : yc - 6;
              const y2 = virar ? yc - 9 : yc + 9;
              const classeCor = esgotado
                ? " texto-esgotado"
                : vermelha || heroi
                ? " texto-branco"
                : " texto-preto";

              return (
                <g key={p.id}>
                  <path
                    d={caminhoFatia(i)}
                    fill={
                      heroi
                        ? "url(#fatiaHeroi)"
                        : vermelha
                        ? "url(#fatiaVermelha)"
                        : "url(#fatiaBranca)"
                    }
                    className={heroi ? "fatia-heroi" : undefined}
                  />
                  <path
                    d={caminhoFatia(i)}
                    fill="#e7e3db"
                    className={esgotado ? "veu-esgotado ativo" : "veu-esgotado"}
                  />
                  {/* HALO: a fatia vencedora pulsa no suspense */}
                  {vencedora === i ? (
                    <path
                      d={caminhoFatia(i)}
                      className="fatia-vencedora"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                    />
                  ) : null}

                  <g transform={`rotate(${mid} ${C} ${C})`}>
                    <g
                      transform={
                        virar ? `rotate(180 ${C} ${yc})` : undefined
                      }
                    >
                      {heroi ? (
                        <text
                          x={C}
                          y={virar ? yc + 22 : yc - 22}
                          textAnchor="middle"
                          className="fatia-estrela"
                        >
                          ★
                        </text>
                      ) : null}
                      <text
                        x={C}
                        y={p.linha2 ? y1 : yc + 3}
                        textAnchor="middle"
                        style={{ fontSize: fs1 }}
                        className={"fatia-texto" + classeCor}
                      >
                        {p.linha1[idioma]}
                      </text>
                      {p.linha2 ? (
                        <text
                          x={C}
                          y={y2}
                          textAnchor="middle"
                          style={{ fontSize: fs2 }}
                          className={"fatia-texto fatia-texto-2" + classeCor}
                        >
                          {p.linha2[idioma]}
                        </text>
                      ) : null}
                    </g>
                  </g>
                </g>
              );
            })}

            {/* separadores: sombra fina + highlight deslocado (lapidado) */}
            {Array.from({ length: N }, (_, i) => {
              const [x1, y1] = ponto(i * SEG, 63);
              const [x2, y2] = ponto(i * SEG, R);
              const [hx1, hy1] = ponto(i * SEG + 0.9, 63);
              const [hx2, hy2] = ponto(i * SEG + 0.9, R);
              return (
                <g key={"sep" + i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(26,26,28,0.12)"
                    strokeWidth="1"
                  />
                  <line
                    x1={hx1}
                    y1={hy1}
                    x2={hx2}
                    y2={hy2}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="0.8"
                  />
                </g>
              );
            })}
          </g>

          {/* luz coerente + encastre por cima das fatias */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="url(#luzDisco)"
            pointerEvents="none"
          />
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="url(#sombraInterior)"
            pointerEvents="none"
          />

          {/* sombra do PONTEIRO projetada na roda (luz topo-esquerda →
              sombra desloca para baixo-direita) */}
          <polygon
            points="209,4 245,4 228,66"
            fill="rgba(26,26,28,0.20)"
            filter="url(#desfoque3)"
          />

          {/* cubo: sombra de contacto + medalhão com bisel */}
          <circle
            cx={C + 2}
            cy={C + 3}
            r="62"
            fill="rgba(26,26,28,0.20)"
            filter="url(#desfoque3)"
          />
          <circle
            cx={C}
            cy={C}
            r="62"
            fill="url(#cuboLuz)"
            stroke="rgba(26,26,28,0.1)"
            strokeWidth="1"
          />
          <circle
            cx={C}
            cy={C}
            r="61"
            fill="none"
            stroke="url(#biselClaro)"
            strokeWidth="1.4"
          />
          <circle
            cx={C}
            cy={C}
            r="53"
            fill="none"
            stroke="#e60009"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <text className="cubo-texto">
            <textPath href="#arcoCubo" startOffset="0%">
              VISIT BRAGA · BRACARA AVGVSTA ·
            </textPath>
          </text>
          {/* sino da marca, vetorial (nunca 404, sempre nítido) */}
          <g transform={`translate(${C - 19} ${C - 21}) scale(${38 / 200})`}>
            <path d="M86 2L114 2L114 21L116 23L124 25L138 33L148 43L153 50L160 68L162 103L166 118L171 128L189 154L193 164L195 173L196 198L115 198L114 199L114 219L86 219L86 200L84 198L4 198L4 177L7 162L12 151L28 129L36 110L37 99L38 98L39 70L43 57L50 45L59 35L69 28L86 21ZM94 54L109 55L118 60L124 67L127 75L128 101L132 122L135 131L142 145L156 164L156 165L106 165L43 165L58 144L67 123L71 104L72 76L74 70L76 66L84 58Z" fill="#e00009" fillRule="evenodd" />
          </g>
        </svg>

        {/* PONTEIRO físico: bisel próprio, sino oficial a badalar */}
        <svg
          ref={ponteiroRef}
          className="ponteiro-sino"
          viewBox="0 0 96 132"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ponteiroGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff1e13" />
              <stop offset="100%" stopColor="#c50007" />
            </linearGradient>
            <linearGradient id="ponteiroBisel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <polygon
            points="14,10 82,10 82,52 48,120 14,52"
            fill="url(#ponteiroGrad)"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polygon
            points="18,14 78,14 78,50 48,112 18,50"
            fill="none"
            stroke="url(#ponteiroBisel)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <g ref={sinoRef} style={{ transformOrigin: "48px 22px" }}>
            <g transform={`translate(26 16) scale(${44 / 200})`}>
              <path d="M86 2L114 2L114 21L116 23L124 25L138 33L148 43L153 50L160 68L162 103L166 118L171 128L189 154L193 164L195 173L196 198L115 198L114 199L114 219L86 219L86 200L84 198L4 198L4 177L7 162L12 151L28 129L36 110L37 99L38 98L39 70L43 57L50 45L59 35L69 28L86 21ZM94 54L109 55L118 60L124 67L127 75L128 101L132 122L135 131L142 145L156 164L156 165L106 165L43 165L58 144L67 123L71 104L72 76L74 70L76 66L84 58Z" fill="#ffffff" fillRule="evenodd" />
            </g>
          </g>
        </svg>
      </div>

      {/* overlays em PORTAL: cobrem o ecrã inteiro, sem o cabeçalho,
          os selos ou o seletor de idiomas a sangrar por cima */}
      {pedirOrigem ? (
        <Portal>
          <PerguntaOrigem
            idioma={idioma}
            aoResponder={() => {
              setPedirOrigem(false);
              executarGiro();
            }}
          />
        </Portal>
      ) : null}

      {resultado ? (
        <Portal>
          <CartaoResultado
            premio={resultado}
            idioma={idioma}
            aoFechar={fecharResultado}
          />
        </Portal>
      ) : null}
    </section>
  );
}
