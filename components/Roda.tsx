"use client";

/**
 * A RODA — disco lavrado, não "roleta de feira"
 * ----------------------------------------------
 * Decisões de desenho (o que a torna diferente):
 *
 * 1. O VERMELHO É ACENTO, NÃO CAMPO. As fatias alternam TINTA e MARFIM;
 *    o vermelho da marca fica reservado ao ponteiro, ao sino do cubo e
 *    ao prémio-herói. Assim, quando aparece vermelho, ele SIGNIFICA
 *    alguma coisa — em vez de gritar em todo o lado.
 *
 * 2. ARO LAVRADO como o canto de uma moeda romana: anel de tinta com
 *    estrias finas e a legenda BRACARA AVGVSTA gravada em marfim.
 *
 * 3. TEXTO RADIAL: corre ao longo do raio, e a metade esquerda espelha,
 *    para nenhum rótulo aparecer de pernas para o ar (o tell nº1 de
 *    roleta amadora). O corpo é calculado por rótulo, em qualquer idioma.
 *
 * 4. LUZ ÚNICA topo-esquerda: biséis, sombras e o brilho do disco
 *    obedecem todos à mesma fonte.
 *
 * A lógica é a que estava provada: sorteio ponderado só entre fatias com
 * stock, RESERVA por transação ANTES de animar, stock visível congelado
 * durante o giro (a fatia só apaga quando a roda pára), física 5–7 voltas
 * com easeOutQuart. A rotação é escrita direto no DOM (sem setState a
 * 60 fps) para não gaguejar em tablets.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PREMIOS, stockInicial, type Premio } from "@/lib/premios";
import { subscreverStock, reservarPremio, registarGiro, type Stock } from "@/lib/stock";
import { tique, pouso, repique, toque } from "@/lib/som";
import type { Idioma } from "@/lib/i18n";

const N = PREMIOS.length;
const SEG = 360 / N;
const C = 240; // centro do viewBox
const R = 168; // raio das fatias
const R_ARO = R + 34; // raio médio do aro lavrado

const ponto = (ang: number, raio: number): [number, number] => {
  const r = ((ang - 90) * Math.PI) / 180;
  return [C + raio * Math.cos(r), C + raio * Math.sin(r)];
};

const fatiaPath = (i: number) => {
  const [x0, y0] = ponto(i * SEG, R);
  const [x1, y1] = ponto((i + 1) * SEG, R);
  return `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`;
};

// pista do texto radial (entre o cubo e o aro)
const DENTRO = 86;
const FORA = 162;
const PISTA = FORA - DENTRO;
const corpo = (txt: string, max: number, larg: number) =>
  Math.max(7.5, Math.min(max, Math.round((PISTA / (txt.length * larg)) * 10) / 10));

const temStock = (p: Premio, s: Stock) => {
  const v = s[p.id];
  return v === null || v === undefined || v > 0;
};

function sortear(stock: Stock, excluir: Set<string>): number {
  const cand = PREMIOS.map((p, i) => ({ p, i })).filter(
    ({ p }) => temStock(p, stock) && !excluir.has(p.id)
  );
  if (!cand.length) return Math.max(0, PREMIOS.findIndex((p) => !p.ganha));
  const total = cand.reduce((s, c) => s + c.p.peso, 0);
  let alvo = Math.random() * total;
  for (const c of cand) {
    alvo -= c.p.peso;
    if (alvo <= 0) return c.i;
  }
  return cand[cand.length - 1].i;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

type Props = {
  idioma: Idioma;
  montra: boolean;
  aGirar: boolean;
  onGirarChange: (v: boolean) => void;
  onResultado: (p: Premio) => void;
};

export default function Roda({
  idioma,
  montra,
  aGirar,
  onGirarChange,
  onResultado,
}: Props) {
  const [stockVisivel, setStockVisivel] = useState<Stock>(stockInicial);
  const stockRef = useRef<Stock>(stockInicial());
  const anguloRef = useRef(0);
  const girandoRef = useRef(false);
  const discoRef = useRef<SVGGElement | null>(null);
  const sinoRef = useRef<SVGGElement | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off = subscreverStock((s) => {
      stockRef.current = s;
      if (!girandoRef.current) setStockVisivel(s);
    });
    return () => {
      off();
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const escrever = (g: number) => {
    anguloRef.current = g;
    if (discoRef.current)
      discoRef.current.style.transform = `rotate(${g}deg)`;
  };

  const badalar = () => {
    const el = sinoRef.current;
    if (!el || typeof el.animate !== "function") return;
    try {
      el.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-12deg)" },
          { transform: "rotate(7deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 250, easing: "ease-out" }
      );
    } catch {}
  };

  const girar = useCallback(async () => {
    if (girandoRef.current) return;
    girandoRef.current = true;
    onGirarChange(true);

    // sorteia + RESERVA antes de animar (anti-corrida entre tablets)
    let venc = -1;
    const fora = new Set<string>();
    for (let k = 0; k <= N; k++) {
      const i = sortear(stockRef.current, fora);
      if (await reservarPremio(PREMIOS[i].id)) {
        venc = i;
        break;
      }
      fora.add(PREMIOS[i].id);
    }
    if (venc < 0) venc = Math.max(0, PREMIOS.findIndex((p) => !p.ganha));

    const centro = venc * SEG + SEG / 2;
    const jitter = (Math.random() - 0.5) * (SEG - 14);
    const alvo = (360 - centro + jitter + 360) % 360;

    const ini = anguloRef.current;
    const norm = ((ini % 360) + 360) % 360;
    const voltas = 5 + Math.floor(Math.random() * 3);
    const delta = voltas * 360 + ((alvo - norm + 360) % 360);
    const dur = 5400 + Math.random() * 900;

    const t0 = performance.now();
    let ultima = Math.floor(norm / SEG);

    const passo = (agora: number) => {
      const t = Math.min(1, (agora - t0) / dur);
      const a = ini + delta * easeOutQuart(t);
      escrever(a);

      const f = Math.floor((((a % 360) + 360) % 360) / SEG);
      if (f !== ultima) {
        ultima = f;
        tique(t); // a altura sobe à medida que abranda
        badalar();
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(passo);
        return;
      }

      /* ENCENAÇÃO EM 3 TEMPOS: parar → suspense → revelação */
      onGirarChange(false);
      setStockVisivel({ ...stockRef.current }); // agora sim a fatia apaga
      pouso();
      const premio = PREMIOS[venc];
      registarGiro(premio.ganha);

      timerRef.current = setTimeout(() => {
        girandoRef.current = false;
        if (premio.ganha) repique();
        else toque();
        onResultado(premio);
      }, premio.ganha ? 380 : 260);
    };

    rafRef.current = requestAnimationFrame(passo);
  }, [onGirarChange, onResultado]);

  /* A página é dona do fluxo (pergunta de origem → giro). Dispara o giro
     com um evento em vez de passar refs para cima: menos acoplamento. */
  useEffect(() => {
    const h = () => girar();
    window.addEventListener("roda:girar", h);
    return () => window.removeEventListener("roda:girar", h);
  }, [girar]);

  return (
    <div className={"roda" + (montra ? " roda-montra" : "") + (aGirar ? " roda-ativa" : "")}>
      <svg className="roda-svg" viewBox="0 0 480 480" role="img" aria-label="Roda de prémios">
        <defs>
          {/* luz única topo-esquerda */}
          <linearGradient id="gTinta" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2b2724" />
            <stop offset="100%" stopColor="#131110" />
          </linearGradient>
          <linearGradient id="gMarfim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbf7ee" />
            <stop offset="100%" stopColor="#e8e0cf" />
          </linearGradient>
          <linearGradient id="gVermelho" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff2415" />
            <stop offset="100%" stopColor="#bd0007" />
          </linearGradient>
          <linearGradient id="gAro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3a3531" />
            <stop offset="52%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#0c0b0a" />
          </linearGradient>
          <linearGradient id="gBisel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="gEncastre" cx="0.5" cy="0.5" r="0.5">
            <stop offset="84%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
          <linearGradient id="gLuz" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <filter id="fSombra" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <path
            id="arcoAro"
            d={`M ${C} ${C} m -${R_ARO} 0 a ${R_ARO} ${R_ARO} 0 1 1 ${R_ARO * 2} 0 a ${R_ARO} ${R_ARO} 0 1 1 -${R_ARO * 2} 0`}
          />
        </defs>

        {/* ARO LAVRADO — canto de moeda romana */}
        <circle cx={C} cy={C} r={R_ARO + 16} fill="url(#gAro)" />
        <circle cx={C} cy={C} r={R_ARO + 15} fill="none" stroke="url(#gBisel)" strokeWidth="1.4" />
        {/* estrias do canto */}
        {Array.from({ length: 96 }, (_, i) => {
          const [xa, ya] = ponto(i * 3.75, R_ARO + 9);
          const [xb, yb] = ponto(i * 3.75, R_ARO + 15);
          return (
            <line key={i} x1={xa} y1={ya} x2={xb} y2={yb} stroke="#6d635a" strokeWidth="1" opacity="0.42" />
          );
        })}
        {/* legenda gravada */}
        <text className="aro-legenda">
          <textPath href="#arcoAro" startOffset="0%">
            BRACARA AVGVSTA · VISIT BRAGA · BRACARA AVGVSTA · VISIT BRAGA ·
          </textPath>
        </text>
        <circle cx={C} cy={C} r={R + 6} fill="none" stroke="#0b0a09" strokeWidth="2" />

        {/* DISCO — roda */}
        <g ref={discoRef} style={{ transformOrigin: `${C}px ${C}px` }}>
          {PREMIOS.map((p, i) => {
            const esgotado = !temStock(p, stockVisivel);
            const heroi = p.heroi === true && !esgotado;
            const escura = i % 2 === 0;
            const mid = i * SEG + SEG / 2;
            const espelha = mid > 180;
            const theta = espelha ? mid + 90 : mid - 90;
            const x = espelha ? C - DENTRO : C + DENTRO;
            const anc = espelha ? "end" : "start";
            const fs1 = corpo(p.nome[idioma], 15.5, 0.68);
            const fs2 = p.subtitulo ? corpo(p.subtitulo[idioma], 12, 0.58) : 0;
            const claro = heroi || escura; // texto claro sobre vermelho/tinta

            return (
              <g key={p.id} className={heroi ? "fatia fatia-heroi" : "fatia"}>
                <path
                  d={fatiaPath(i)}
                  fill={
                    esgotado
                      ? "#8d867c"
                      : heroi
                      ? "url(#gVermelho)"
                      : escura
                      ? "url(#gTinta)"
                      : "url(#gMarfim)"
                  }
                />
                <g transform={`rotate(${theta} ${C} ${C})`}>
                  <text
                    x={x}
                    y={p.subtitulo ? C - 3 : C + 4}
                    textAnchor={anc}
                    style={{ fontSize: fs1 }}
                    className={"fatia-nome " + (esgotado ? "t-apagado" : claro ? "t-claro" : "t-escuro")}
                  >
                    {p.nome[idioma]}
                  </text>
                  {p.subtitulo ? (
                    <text
                      x={x}
                      y={C + 13}
                      textAnchor={anc}
                      style={{ fontSize: fs2 }}
                      className={"fatia-sub " + (esgotado ? "t-apagado" : claro ? "t-claro" : "t-escuro")}
                    >
                      {p.subtitulo[idioma]}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}

          {/* separadores lapidados: fio escuro + realce deslocado */}
          {Array.from({ length: N }, (_, i) => {
            const [x1, y1] = ponto(i * SEG, 74);
            const [x2, y2] = ponto(i * SEG, R);
            const [hx1, hy1] = ponto(i * SEG + 0.8, 74);
            const [hx2, hy2] = ponto(i * SEG + 0.8, R);
            return (
              <g key={"s" + i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
                <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke="rgba(255,255,255,0.22)" strokeWidth="0.7" />
              </g>
            );
          })}
        </g>

        {/* luz e encastre por cima do disco */}
        <circle cx={C} cy={C} r={R} fill="url(#gLuz)" pointerEvents="none" />
        <circle cx={C} cy={C} r={R} fill="url(#gEncastre)" pointerEvents="none" />

        {/* CUBO — medalhão marfim com o sino da marca em vermelho */}
        <circle cx={C + 2} cy={C + 3} r="72" fill="rgba(0,0,0,0.35)" filter="url(#fSombra)" />
        <circle cx={C} cy={C} r="72" fill="url(#gMarfim)" />
        <circle cx={C} cy={C} r="71" fill="none" stroke="url(#gBisel)" strokeWidth="1.5" />
        <circle cx={C} cy={C} r="62" fill="none" stroke="#d8cfba" strokeWidth="1" />
        <image href="/sino-braga-vermelho.png" x={C - 26} y={C - 29} width="52" height="58" />
      </svg>

      {/* PONTEIRO — cunha vermelha com o sino, badala a cada fatia */}
      <svg className="ponteiro" viewBox="0 0 80 110" aria-hidden="true">
        <defs>
          <linearGradient id="gPonteiro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff2415" />
            <stop offset="100%" stopColor="#bd0007" />
          </linearGradient>
        </defs>
        <path d="M40 104 L8 34 A34 34 0 1 1 72 34 Z" fill="url(#gPonteiro)" />
        <path
          d="M40 96 L15 33 A28 28 0 1 1 65 33 Z"
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="1.2"
        />
        <g ref={sinoRef} style={{ transformOrigin: "40px 20px" }}>
          <image href="/sino-braga-branco.png" x="22" y="14" width="36" height="40" />
        </g>
      </svg>
    </div>
  );
}
