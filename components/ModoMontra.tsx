"use client";

/**
 * MODO MONTRA — "VERMELHO TOTAL", com fotografia do destino
 * ----------------------------------------------------------
 * Após ~45 s de inatividade, o ecrã inteiro passa a farol vermelho: o
 * sino oficial badala, o CTA alterna nas 3 línguas e o fundo é um
 * slideshow de Braga em DUOTONE VERMELHO, com Ken Burns lento e a
 * legenda do local no idioma ativo.
 *
 * ROBUSTEZ DE STAND (as fotos são servidas por URL, ver lib/fotos.ts):
 * - só entra em modo fotografia quando pelo menos uma foto CARREGOU
 *   mesmo (nada de ecrã meio vazio à espera da rede)
 * - se uma foto falhar, é saltada; se falharem todas (wi-fi em baixo),
 *   volta sozinha à versão gráfica de raios — o stand nunca mostra um
 *   ícone de imagem partida
 * - o slideshow só avança entre fotos que carregaram
 */

import { useEffect, useMemo, useState } from "react";
import { MONTRA_CTA, T, type Idioma } from "@/lib/i18n";
import { FOTOS, FOTOS_ATIVAS, SEGUNDOS_POR_FOTO } from "@/lib/fotos";
import Sino from "./Sino";

export default function ModoMontra({ idioma }: { idioma: Idioma }) {
  const [indice, setIndice] = useState(0);
  const [passo, setPasso] = useState(0);
  // estado de carregamento por foto: só as que carregaram entram no ciclo
  const [prontas, setProntas] = useState<boolean[]>(() =>
    FOTOS.map(() => false)
  );
  const [falhadas, setFalhadas] = useState<boolean[]>(() =>
    FOTOS.map(() => false)
  );

  // CTA alternado nas 3 línguas
  useEffect(() => {
    const intervalo = setInterval(
      () => setIndice((i) => (i + 1) % MONTRA_CTA.length),
      2400
    );
    return () => clearInterval(intervalo);
  }, []);

  // índices das fotos efetivamente disponíveis
  const disponiveis = useMemo(
    () =>
      FOTOS.map((_, i) => i).filter((i) => prontas[i] && !falhadas[i]),
    [prontas, falhadas]
  );

  const temFotos = FOTOS_ATIVAS && disponiveis.length > 0;

  // slideshow: só avança entre as que carregaram
  useEffect(() => {
    if (!temFotos) return;
    const intervalo = setInterval(
      () => setPasso((p) => p + 1),
      SEGUNDOS_POR_FOTO * 1000
    );
    return () => clearInterval(intervalo);
  }, [temFotos]);

  const atual = temFotos
    ? disponiveis[passo % disponiveis.length]
    : -1;

  return (
    <div className="montra-veu" aria-hidden="true">
      {/* as imagens são sempre montadas (para carregarem), mas só se
          revelam quando prontas — e a camada de raios fica por baixo
          como rede de segurança se a rede falhar */}
      {!temFotos ? <div className="montra-raios" /> : null}

      {FOTOS_ATIVAS ? (
        <div className={"montra-fotos" + (temFotos ? " visivel" : "")}>
          {FOTOS.map((f, i) => (
            <img
              key={f.ficheiro}
              src={f.ficheiro}
              alt=""
              className={"montra-foto" + (i === atual ? " ativa" : "")}
              onLoad={() =>
                setProntas((p) => {
                  if (p[i]) return p;
                  const novo = [...p];
                  novo[i] = true;
                  return novo;
                })
              }
              onError={() =>
                setFalhadas((f2) => {
                  if (f2[i]) return f2;
                  const novo = [...f2];
                  novo[i] = true;
                  return novo;
                })
              }
            />
          ))}
          {temFotos ? <div className="montra-duotone" /> : null}
        </div>
      ) : null}

      <div className="montra-conteudo">
        <Sino className="montra-sino" />
        <p className="montra-cta" key={indice}>
          {MONTRA_CTA[indice]}
        </p>
        <p className="montra-toca">
          {T.montraToca.pt} · {T.montraToca.es} · {T.montraToca.en}
        </p>
      </div>

      {temFotos && atual >= 0 ? (
        <p className="montra-legenda" key={atual}>
          {FOTOS[atual].local[idioma]}
        </p>
      ) : null}
    </div>
  );
}
