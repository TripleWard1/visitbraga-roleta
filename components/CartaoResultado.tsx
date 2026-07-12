"use client";

/**
 * BILHETE DE RESULTADO + CONFETES
 * --------------------------------
 * Bilhete branco e limpo: canhoto picotado com QR e o sino da marca.
 * (O carimbo saiu: era um floreado genérico de cupão, não dizia nada da
 * marca e ainda tapava o texto.) Na VITÓRIA chove confete vermelho/branco/preto
 * e o bilhete só fecha quando o staff toca em "Entregue" (incrementa
 * o contador público). Na DERROTA, mostra-se uma fotografia de Braga
 * (o convite) e fecha automático aos 20 s.
 *
 * O véu de fundo é VERMELHO na vitória (visível do outro lado do
 * corredor da feira) e neutro na derrota.
 *
 * QR: imagem via api.qrserver.com (sem dependências); o URL escrito
 * por baixo garante a informação mesmo sem rede.
 */

import { useEffect, useMemo, useState } from "react";
import type { Premio } from "@/lib/premios";
import { QR_URL } from "@/lib/config";
import { registarEntrega } from "@/lib/stock";
import { t, MENSAGENS_VITORIA, type Idioma } from "@/lib/i18n";
import { Icone } from "@/lib/icones";
import { FOTOS, FOTOS_ATIVAS } from "@/lib/fotos";
import Sino from "./Sino";

type Props = {
  premio: Premio;
  idioma: Idioma;
  aoFechar: () => void;
};

type Confete = {
  esq: number;
  atraso: number;
  dur: number;
  larg: number;
  alt: number;
  cor: string;
  rot: number;
};

const CORES_CONFETE = ["#fe0000", "#111111", "#ffffff", "#fe0000"];

export default function CartaoResultado({ premio, idioma, aoFechar }: Props) {
  const mensagem = useMemo(
    () =>
      MENSAGENS_VITORIA[Math.floor(Math.random() * MENSAGENS_VITORIA.length)],
    []
  );

  /* DERROTA = CONVITE: uma fotografia de Braga ao acaso. A pessoa está
     parada, sem prémio e a olhar para o ecrã — é o melhor momento da
     app para lhe mostrar a cidade. */
  const convite = useMemo(() => {
    if (premio.ganha || !FOTOS_ATIVAS || FOTOS.length === 0) return null;
    return FOTOS[Math.floor(Math.random() * FOTOS.length)];
  }, [premio.ganha]);

  // se a foto do convite não carregar (wi-fi da feira em baixo),
  // o bilhete volta à mascote — nunca mostra imagem partida
  const [conviteFalhou, setConviteFalhou] = useState(false);
  const [fundoFalhou, setFundoFalhou] = useState(false);
  const [bracvsFalhou, setBracvsFalhou] = useState(false);

  /* fotografia de fundo da vitória (uma ao acaso) */
  const fundo = useMemo(() => {
    if (!premio.ganha || !FOTOS_ATIVAS || FOTOS.length === 0) return null;
    return FOTOS[Math.floor(Math.random() * FOTOS.length)];
  }, [premio.ganha]);

  // confetes só na vitória (gerados uma vez)
  const confetes = useMemo<Confete[]>(() => {
    if (!premio.ganha) return [];
    return Array.from({ length: 60 }, (_, i) => ({
      esq: Math.random() * 100,
      atraso: 0.08 + Math.random() * 0.45, // rajada única, não gotejamento
      dur: 2.4 + Math.random() * 1.6,
      larg: 7 + Math.random() * 7,
      alt: 10 + Math.random() * 8,
      cor: CORES_CONFETE[i % CORES_CONFETE.length],
      rot: Math.random() * 360,
    }));
  }, [premio.ganha]);

  // derrota: fecha sozinho ao fim de 15 s
  useEffect(() => {
    if (premio.ganha) return;
    const tempo = setTimeout(aoFechar, 20000);
    return () => clearTimeout(tempo);
  }, [premio.ganha, aoFechar]);

  const nomePremio =
    premio.linha1[idioma] + (premio.linha2 ? " " + premio.linha2[idioma] : "");

  const urlQr =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" +
    encodeURIComponent(QR_URL);

  const urlLegivel = QR_URL.replace(/^https?:\/\/(www\.)?/, "");

  return (
    /* TEATRO DE STAND: a vitória pinta o ECRÃ INTEIRO de vermelho festivo.
       De 15 metros, quem passa no corredor vê o ecrã "explodir" e aproxima-se
       — com um véu escuro, ninguém percebia que algo bom tinha acontecido.
       A derrota mantém o véu neutro (discrição). */
    <div
      className={
        "resultado-veu" + (premio.ganha ? " veu-vitoria" : " veu-neutro")
      }
      role="dialog"
      aria-modal="true"
    >
      {/* FUNDO DA VITÓRIA: uma fotografia de Braga em duotone vermelho, o
          mesmo tratamento do modo montra. Antes eram raios abstratos — um
          enfeite sem nexo. Agora o fundo é a cidade de que a pessoa acabou
          de ganhar um pedaço. Se a foto não carregar, cai nos raios. */}
      {premio.ganha ? (
        <div className="veu-fundo" aria-hidden="true">
          {fundo && !fundoFalhou ? (
            <>
              <img
                src={fundo.ficheiro}
                alt=""
                className="veu-foto"
                onError={() => setFundoFalhou(true)}
              />
              <div className="veu-duotone" />
            </>
          ) : (
            <div className="veu-raios" />
          )}
        </div>
      ) : null}
      {/* chuva de confete (vitória) */}
      {confetes.length > 0 ? (
        <div className="confetes" aria-hidden="true">
          {confetes.map((c, i) => (
            <i
              key={i}
              style={{
                left: c.esq + "%",
                width: c.larg,
                height: c.alt,
                background: c.cor,
                animationDelay: c.atraso + "s",
                animationDuration: c.dur + "s",
                transform: `rotate(${c.rot}deg)`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Bracvs a festejar ao lado do bilhete: o clímax é dele também */}
      {premio.ganha && !bracvsFalhou ? (
        <img
          src="/mascote-bracvs.png"
          alt=""
          className="vitoria-bracvs"
          aria-hidden="true"
          width={272}
          height={442}
          onError={() => setBracvsFalhou(true)}
        />
      ) : null}

      <div className={`bilhete${premio.ganha ? " bilhete-vitoria" : ""}`}>

        <div className="bilhete-corpo">
          <div className="bilhete-principal">
            {premio.ganha ? (
              <>
                {/* ícone do prémio, do conjunto próprio: dá identidade ao
                    momento e diz o que é sem depender da língua */}
                <span
                  className={
                    "bilhete-icone" + (premio.destaque ? " icone-heroi" : "")
                  }
                >
                  <Icone nome={premio.icone} tamanho={54} />
                </span>
                <p className="bilhete-rotulo">{mensagem[idioma]}</p>
                <h2 className="bilhete-premio">{nomePremio}</h2>
                <p className="bilhete-instrucao">{t("mostraEquipa", idioma)}</p>
                <button
                  className="botao-entregue"
                  onClick={() => {
                    registarEntrega();
                    aoFechar();
                  }}
                >
                  {t("entregue", idioma)}
                </button>
              </>
            ) : (
              <>
                <span className="bilhete-icone icone-neutro">
                  <Icone nome="sem-sorte" tamanho={44} />
                </span>
                <p className="bilhete-rotulo bilhete-rotulo-derrota">
                  {t("derrota", idioma)}
                </p>
                {convite && !conviteFalhou ? (
                  <div className="bilhete-convite">
                    <img
                      src={convite.ficheiro}
                      alt=""
                      onError={() => setConviteFalhou(true)}
                    />
                    <p className="bilhete-convite-legenda">
                      {convite.local[idioma]}
                    </p>
                  </div>
                ) : (
                  <img
                    src="/mascote-bracvs.png"
                    alt=""
                    className="bilhete-bracvs"
                    width={272}
                    height={442}
                  />
                )}
                <button className="botao-fechar" onClick={aoFechar}>
                  {t("fechar", idioma)}
                </button>
              </>
            )}
          </div>

          {/* canhoto picotado com o QR */}
          <div className="bilhete-canhoto">
            <Sino className="canhoto-sino" />
            <p className="canhoto-titulo">{t("levaBraga", idioma)}</p>
            <img
              src={urlQr}
              alt={`QR code — ${QR_URL}`}
              className="canhoto-qr"
              width={110}
              height={110}
            />
            <p className="canhoto-url">{urlLegivel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
