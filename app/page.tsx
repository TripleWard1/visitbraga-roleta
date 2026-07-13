"use client";

/**
 * PÁGINA - sem scroll, sem rodapé, a roda impossível de descentrar
 * ------------------------------------------------------------------
 * O que estava errado e porquê:
 *
 * · A RODA DESCENTRADA vinha de a grelha ter de arbitrar entre a mascote e
 *   a roda. Agora a roda está SOZINHA no fluxo, centrada por um flex - e a
 *   mascote está ancorada A ELA (posição absoluta dentro do palco da roda).
 *   Fisicamente não pode descentrar.
 * · O RODAPÉ foi eliminado. Os selos e o contador passaram a viver no chão
 *   da cena, sem consumir altura do fluxo.
 * · SEM SCROLL em lado nenhum: tudo é dimensionado contra 100dvh.
 */

import { useCallback, useEffect, useState } from "react";
import Roleta from "@/components/Roleta";
import SeletorIdioma from "@/components/SeletorIdioma";
import ModoMontra from "@/components/ModoMontra";
import Portal from "@/components/Portal";
import FundoCartaz from "@/components/FundoCartaz";
import Bracvs, { type Fase } from "@/components/Bracvs";
import BotaoSom from "@/components/BotaoSom";
import { idiomaInicial, t, type Idioma } from "@/lib/i18n";
import { FACTOS } from "@/lib/factos";
import { SEGUNDOS_MONTRA, MOSTRAR_REGRA } from "@/lib/config";
import { useEcraSempreAceso } from "@/lib/useEcraSempreAceso";

export default function Pagina() {
  const [idioma, setIdioma] = useState<Idioma>("en");
  const [montra, setMontra] = useState(false);
  const [fase, setFase] = useState<Fase>("repouso");
  const [ocupada, setOcupada] = useState(false);
  const [facto, setFacto] = useState(0);

  useEcraSempreAceso();

  useEffect(() => setIdioma(idiomaInicial()), []);
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  useEffect(() => {
    let tempo: ReturnType<typeof setTimeout>;
    const rearmar = () => {
      clearTimeout(tempo);
      tempo = setTimeout(() => {
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
      clearTimeout(tempo);
    };
  }, [ocupada]);

  const aoOcupada = useCallback((v: boolean) => setOcupada(v), []);

  const girar = useCallback(() => {
    if (ocupada) return;
    setFacto(Math.floor(Math.random() * FACTOS.length));
    window.dispatchEvent(new Event("roda:girar"));
  }, [ocupada]);

  return (
    <>
      <FundoCartaz variante="creme" />

      {/* AURA: um halo vermelho que RESPIRA por trás da roda e se acende
          durante o giro - a "iluminação teatral" sem custo de performance */}
      <div className={"aura fase-" + fase} aria-hidden="true" />

      {/* ORNAMENTOS: zigzags do escadório nos cantos, em vez de um rodapé
          que come altura. Decoram sem ocupar o fluxo. */}
      <div className="ornamento canto-ne" aria-hidden="true" />
      <div className="ornamento canto-so" aria-hidden="true" />

      <main className={"pagina fase-" + fase}>
        <header className="cabecalho">
          <BotaoSom />
          <img src="/logo-claro.png" alt="Visit Braga" className="logo" />
          <p className="tagline">{t("tagline", idioma)}</p>
          <SeletorIdioma idioma={idioma} aoMudar={setIdioma} />
        </header>

        {/* PALCO DA RODA: a roda está sozinha no fluxo (por isso fica sempre
            centrada) e a mascote está ancorada a ela, do lado esquerdo. */}
        <section className="palco">
          <div className="roda-palco">
            <Roleta
              idioma={idioma}
              montra={montra}
              onOcupadaChange={aoOcupada}
              onFase={setFase}
            />
            <Bracvs fase={fase} />
          </div>

          <div className="acao">
            {fase === "giro" ? (
              <div className="facto" key={facto}>
                <span className="facto-rotulo">{t("sabiasQue", idioma)}</span>
                <p>{FACTOS[facto][idioma]}</p>
              </div>
            ) : (
              <>
                <button className="botao-girar" onClick={girar} disabled={ocupada}>
                  {t("girar", idioma)}
                </button>
                {MOSTRAR_REGRA ? (
                  <p className="regra">{t("regraCasa", idioma)}</p>
                ) : null}
              </>
            )}
          </div>
        </section>

      </main>

      {montra ? (
        <Portal>
          <ModoMontra idioma={idioma} />
        </Portal>
      ) : null}
    </>
  );
}
