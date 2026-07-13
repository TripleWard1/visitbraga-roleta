"use client";

/**
 * PÁGINA - MOBILE-FIRST, EM FLUXO
 * ---------------------------------
 * O layout anterior foi feito para desktop e espremido à martelada dentro
 * de 100vh, com posicionamento absoluto. Resultado: overflow horizontal em
 * espanhol, selos cortados, mascote por cima do aro da roda.
 *
 * Agora: fluxo normal (flex/grid), tipografia fluida, zero px fixos no
 * layout, e em ecrãs pequenos a página ROLA em vez de comprimir. O absoluto
 * fica só para decoração (o fundo).
 *
 * A MASCOTE TEM CÉLULA PRÓPRIA na grelha do palco - nunca sobrepõe a roda e
 * nunca é escondida. Em mobile fica ao lado do botão GIRAR, a olhar para a
 * roda; em desktop, ao lado da roda. É a mesma marcação nos dois casos: só
 * muda a grelha.
 */

import { useCallback, useEffect, useState } from "react";
import Roleta from "@/components/Roleta";
import SeletorIdioma from "@/components/SeletorIdioma";
import ModoMontra from "@/components/ModoMontra";
import Portal from "@/components/Portal";
import ContadorPremios from "@/components/ContadorPremios";
import FaixaSelos from "@/components/FaixaSelos";
import FundoCartaz from "@/components/FundoCartaz";
import Bracvs, { type Fase } from "@/components/Bracvs";
import BotaoSom from "@/components/BotaoSom";
import { idiomaInicial, t, type Idioma } from "@/lib/i18n";
import { FACTOS } from "@/lib/factos";
import { SEGUNDOS_MONTRA, MOSTRAR_SELOS, MOSTRAR_REGRA } from "@/lib/config";
import { useEcraSempreAceso } from "@/lib/useEcraSempreAceso";

export default function Pagina() {
  const [idioma, setIdioma] = useState<Idioma>("en");
  const [montra, setMontra] = useState(false);
  const [fase, setFase] = useState<Fase>("repouso");
  const [ocupada, setOcupada] = useState(false);
  const [facto, setFacto] = useState(0);

  useEcraSempreAceso();

  useEffect(() => {
    setIdioma(idiomaInicial());
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  // inatividade → modo montra (e o idioma volta ao da feira)
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>;
    const rearmar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        if (!ocupada) {
          setMontra(true);
          setIdioma(idiomaInicial());
        }
      }, SEGUNDOS_MONTRA * 1000);
    };
    const acordar = () => {
      setMontra(false);
      rearmar();
    };
    window.addEventListener("pointerdown", acordar);
    window.addEventListener("keydown", acordar);
    rearmar();
    return () => {
      window.removeEventListener("pointerdown", acordar);
      window.removeEventListener("keydown", acordar);
      clearTimeout(temporizador);
    };
  }, [ocupada]);

  const aoOcupada = useCallback((v: boolean) => setOcupada(v), []);

  /* pedir o giro à roda (ela é dona da física e do stock; nós, do botão) */
  const girar = useCallback(() => {
    if (ocupada) return;
    setFacto(Math.floor(Math.random() * FACTOS.length));
    window.dispatchEvent(new Event("roda:girar"));
  }, [ocupada]);

  return (
    <>
      {/* FUNDO: a fórmula do cartaz (campo + silhuetas gigantes + grão) */}
      <FundoCartaz variante="creme" />

      <main className={"pagina fase-" + fase}>
        <header className="cabecalho">
          <BotaoSom />
          <img src="/logo-claro.png" alt="Visit Braga" className="logo" />
          <p className="tagline">{t("tagline", idioma)}</p>
          <SeletorIdioma idioma={idioma} aoMudar={setIdioma} />
        </header>

        {/* PALCO - estrutura simples e à prova de bala:
            a roda SEMPRE centrada; por baixo, uma linha com o Bracvs ao lado
            do botão GIRAR (a olhar para cima, na direção da roda). A mesma
            disposição em mobile e em desktop - sem media queries a lutar
            entre si, e sem a roda a fugir para um lado. */}
        <section className="palco">
          <div className="celula-roda">
            <Roleta
              idioma={idioma}
              montra={montra}
              onOcupadaChange={aoOcupada}
              onFase={setFase}
            />
          </div>

          {/* a mascote é irmã da roda (não vive por baixo dela): em desktop
              fica AO LADO, o que poupa ~300 px de altura e faz tudo caber
              sem scroll. Em mobile desce para junto do botão. */}
          <Bracvs fase={fase} />

          <div className="acao-coluna">
            {fase === "giro" ? (
              <div className="facto" key={facto}>
                <span className="facto-rotulo">{t("sabiasQue", idioma)}</span>
                <p>{FACTOS[facto][idioma]}</p>
              </div>
            ) : (
              <>
                <button
                  className="botao-girar"
                  onClick={girar}
                  disabled={ocupada}
                >
                  {t("girar", idioma)}
                </button>
                {MOSTRAR_REGRA ? (
                  <p className="regra">{t("regraCasa", idioma)}</p>
                ) : null}
              </>
            )}
          </div>
        </section>

        <footer className="rodape">
          <div className="rodape-zig" aria-hidden="true" />
          <div className="rodape-conteudo">
            {MOSTRAR_SELOS ? <FaixaSelos idioma={idioma} /> : null}
            <ContadorPremios idioma={idioma} />
          </div>
        </footer>
      </main>

      {montra ? (
        <Portal>
          <ModoMontra idioma={idioma} />
        </Portal>
      ) : null}
    </>
  );
}
