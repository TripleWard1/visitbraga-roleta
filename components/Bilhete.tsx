"use client";

/**
 * RESULTADO - "selo de bronze" em vez de talão de talho
 * ------------------------------------------------------
 * VITÓRIA: o ecrã inteiro fica vermelho (visível do outro lado do
 * corredor da feira - se ficasse escuro, ninguém percebia que tinha
 * acontecido algo bom). Confete em rajada única. O cartão só fecha
 * quando o STAFF confirma "Entregue", o que impede o mesmo prémio de
 * ser reclamado duas vezes e alimenta o contador público.
 *
 * DERROTA: fundo tinta, tom sóbrio e uma frase que converte a perda em
 * convite. Fecha sozinho aos 16 s.
 */

import { useEffect, useMemo, useState } from "react";
import type { Premio } from "@/lib/premios";
import { QR_URL } from "@/lib/config";
import { registarEntrega } from "@/lib/stock";
import { Icone } from "@/lib/icones";
import { t, MENSAGENS_VITORIA, type Idioma } from "@/lib/i18n";

const CORES = ["#e00009", "#ffffff", "#1c1917", "#ff2415"];

export default function Bilhete({
  premio,
  idioma,
  aoFechar,
}: {
  premio: Premio;
  idioma: Idioma;
  aoFechar: () => void;
}) {
  const [confirmado, setConfirmado] = useState(false);

  const mensagem = useMemo(
    () => MENSAGENS_VITORIA[Math.floor(Math.random() * MENSAGENS_VITORIA.length)],
    []
  );

  const confetes = useMemo(() => {
    if (!premio.ganha) return [];
    return Array.from({ length: 70 }, (_, i) => ({
      x: Math.random() * 100,
      atraso: Math.random() * 0.5,
      dur: 2.2 + Math.random() * 1.8,
      l: 6 + Math.random() * 7,
      a: 9 + Math.random() * 9,
      cor: CORES[i % CORES.length],
      rot: Math.random() * 360,
    }));
  }, [premio.ganha]);

  useEffect(() => {
    if (premio.ganha) return;
    const tm = setTimeout(aoFechar, 16000);
    return () => clearTimeout(tm);
  }, [premio.ganha, aoFechar]);

  const nome =
    premio.nome[idioma] + (premio.subtitulo ? " " + premio.subtitulo[idioma] : "");

  const qr =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=" +
    encodeURIComponent(QR_URL);

  return (
    <div className={"veu " + (premio.ganha ? "veu-vitoria" : "veu-tinta")} role="dialog" aria-modal="true">
      {premio.ganha ? (
        <>
          <div className="veu-raios" aria-hidden="true" />
          <div className="confetes" aria-hidden="true">
            {confetes.map((c, i) => (
              <i
                key={i}
                style={{
                  left: c.x + "%",
                  width: c.l,
                  height: c.a,
                  background: c.cor,
                  animationDelay: c.atraso + "s",
                  animationDuration: c.dur + "s",
                  transform: `rotate(${c.rot}deg)`,
                }}
              />
            ))}
          </div>
          <img src="/mascote-bracvs.png" alt="" className="vitoria-bracvs" aria-hidden="true" />
        </>
      ) : null}

      <div className={"cartao resultado" + (premio.ganha ? " ganhou" : " perdeu")}>
        {premio.ganha ? (
          <>
            <span className={"selo" + (premio.heroi ? " selo-heroi" : "")}>
              <Icone nome={premio.icone} tamanho={52} />
            </span>
            <p className="resultado-eyebrow">{mensagem[idioma]}</p>
            <h2 className="resultado-premio">{nome}</h2>
            <p className="resultado-nota">{t("mostraEquipa", idioma)}</p>

            <div className="resultado-rodape">
              <button
                className={"botao-entregue" + (confirmado ? " a-confirmar" : "")}
                onClick={() => {
                  if (confirmado) return;
                  setConfirmado(true);
                  registarEntrega();
                  setTimeout(aoFechar, 420);
                }}
              >
                <Icone nome="sino" tamanho={18} />
                {t("entregue", idioma)}
              </button>
              <div className="qr">
                <img src={qr} alt={QR_URL} />
                <span>{t("levaBraga", idioma)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="selo selo-neutro">
              <Icone nome="sem-sorte" tamanho={40} />
            </span>
            <h2 className="resultado-derrota">{t("derrotaTitulo", idioma)}</h2>
            <p className="resultado-nota">{t("derrotaTexto", idioma)}</p>
            <div className="resultado-rodape">
              <button className="botao-fechar" onClick={aoFechar}>
                {t("fechar", idioma)}
              </button>
              <div className="qr">
                <img src={qr} alt={QR_URL} />
                <span>{t("levaBraga", idioma)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
