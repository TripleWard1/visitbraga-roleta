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
 * QR oficial servido de /public (offline). O URL escrito por baixo é a
 * rede de segurança final.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dispararConfetes } from "@/lib/confetti";
import { vibrar } from "@/lib/audio";
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



export default function CartaoResultado({ premio, idioma, aoFechar }: Props) {
  const mensagem = useMemo(
    () =>
      MENSAGENS_VITORIA[Math.floor(Math.random() * MENSAGENS_VITORIA.length)],
    []
  );

  /* DERROTA = CONVITE: uma fotografia de Braga ao acaso. A pessoa está
     parada, sem prémio e a olhar para o ecrã - é o melhor momento da
     app para lhe mostrar a cidade. */
  const convite = useMemo(() => {
    if (premio.ganha || !FOTOS_ATIVAS || FOTOS.length === 0) return null;
    return FOTOS[Math.floor(Math.random() * FOTOS.length)];
  }, [premio.ganha]);

  // se a foto do convite não carregar (wi-fi da feira em baixo),
  // o bilhete volta à mascote - nunca mostra imagem partida
  const [conviteFalhou, setConviteFalhou] = useState(false);
  const [fundoFalhou, setFundoFalhou] = useState(false);
  const [bracvsFalhou, setBracvsFalhou] = useState(false);

  /* ── PREMIR 2 s PARA CONFIRMAR ──
     O lag vinha daqui: eu estava a fazer setState 60 vezes por segundo, o
     que obrigava o React a re-renderizar o cartão inteiro (ícone, textos,
     QR) a cada frame. Agora o progresso é escrito DIRETO no DOM, fora do
     ciclo do React - só há um re-render, no fim. */
  const [aConfirmar, setAConfirmar] = useState(false);
  const anelRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef(0);
  const feitoRef = useRef(false);

  const DURACAO = 2000;

  const pintar = (pct: number) => {
    if (anelRef.current) anelRef.current.style.width = pct + "%";
  };

  const pararConfirmacao = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (feitoRef.current) return;
    setAConfirmar(false);
    pintar(0);
  }, []);

  const comecarConfirmacao = useCallback(() => {
    if (feitoRef.current) return;
    setAConfirmar(true);
    vibrar(12);
    const t0 = performance.now();
    const passo = (agora: number) => {
      const p = Math.min(100, ((agora - t0) / DURACAO) * 100);
      pintar(p);                       // DOM direto: zero re-renders
      if (p >= 100) {
        feitoRef.current = true;
        vibrar([24, 30, 24]);
        registarEntrega();
        setTimeout(aoFechar, 240);
        return;
      }
      rafRef.current = requestAnimationFrame(passo);
    };
    rafRef.current = requestAnimationFrame(passo);
  }, [aoFechar]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* fotografia de fundo da vitória (uma ao acaso) */
  const fundo = useMemo(() => {
    if (!premio.ganha || !FOTOS_ATIVAS || FOTOS.length === 0) return null;
    return FOTOS[Math.floor(Math.random() * FOTOS.length)];
  }, [premio.ganha]);

  // confetes só na vitória (gerados uma vez)
  /* CONFETES com física própria (lib/confetti.ts): rajadas laterais dos
     cantos de baixo, gravidade, arrasto do ar e rotação em dois eixos -
     as peças rodopiam como papel a sério. Zero dependências: o npm do
     ambiente rebentou e um stand de feira não pode depender disso. */
  useEffect(() => {
    if (!premio.ganha) return;
    dispararConfetes(150);
    vibrar([18, 40, 26]);
  }, [premio.ganha]);

  // derrota: fecha sozinho ao fim de 15 s
  /* TIMEOUT - o quiosque nunca fica preso.
     Derrota: 20 s. VITÓRIA: 90 s. Antes a vitória não tinha timeout: se o
     visitante ganhasse e fosse embora sem a equipa confirmar, o ecrã ficava
     encravado nesse prémio até alguém reparar. Num dia de feira cheio, isso
     é o stand parado. */
  useEffect(() => {
    const tempo = setTimeout(aoFechar, premio.ganha ? 90000 : 20000);
    return () => clearTimeout(tempo);
  }, [premio.ganha, aoFechar]);

  const nomePremio =
    premio.linha1[idioma] + (premio.linha2 ? " " + premio.linha2[idioma] : "");

  /* QR OFICIAL, servido de /public. Antes vinha de api.qrserver.com e
     desaparecia sem rede - ou seja, o veículo de promoção do destino
     falhava exactamente nas condições em que as feiras vivem. Sendo a
     imagem oficial (com o rastreio do Município), também não há risco de
     apontar para o sítio errado. */
  const urlQr = "/qr-visitbraga.png";

  const urlLegivel = QR_URL.replace(/^https?:\/\/(www\.)?/, "");

  return (
    /* TEATRO DE STAND: a vitória pinta o ECRÃ INTEIRO de vermelho festivo.
       De 15 metros, quem passa no corredor vê o ecrã "explodir" e aproxima-se
       - com um véu escuro, ninguém percebia que algo bom tinha acontecido.
       A derrota mantém o véu neutro (discrição). */
    <div
      className={
        "resultado-veu" + (premio.ganha ? " veu-vitoria" : " veu-neutro")
      }
      role="dialog"
      aria-modal="true"
    >
      {/* FUNDO DA VITÓRIA: uma fotografia de Braga em duotone vermelho, o
          mesmo tratamento do modo montra. Antes eram raios abstratos - um
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
                {/* PREMIR 2 SEGUNDOS: um onClick simples deixava qualquer
                    visitante queimar o prémio ao tocar por curiosidade. É um
                    gesto deliberado, com anel de progresso, e só a equipa o faz. */}
                <button
                  className={"botao-entregue" + (aConfirmar ? " a-confirmar" : "")}
                  onPointerDown={comecarConfirmacao}
                  onPointerUp={pararConfirmacao}
                  onPointerLeave={pararConfirmacao}
                  onPointerCancel={pararConfirmacao}
                >
                  <span
                    ref={anelRef}
                    className="entregue-anel"
                    aria-hidden="true"
                  />
                  <span className="entregue-texto">
                    {aConfirmar
                      ? t("entregueManter", idioma)
                      : t("entregue", idioma)}
                  </span>
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
              alt={`QR code - ${QR_URL}`}
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
