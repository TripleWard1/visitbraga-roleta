"use client";

/**
 * PÁGINA PRINCIPAL - "ZIGZAG BRAGA" (refinada)
 * ---------------------------------------------
 * Composição limpa e profissional: cabeçalho discreto com divisor
 * zigzag fino, roleta gigante como protagonista absoluta (o Bracvs
 * vive ancorado a ela, dentro do componente Roleta), base vermelha
 * com dentes finos de escadório e contador em pastilha. Sem texturas
 * de padrão - a atmosfera vem de luz suave e sombra, não de enfeites.
 * Após inatividade entra o modo montra "Vermelho Total".
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Roleta from "@/components/Roleta";
import SeletorIdioma from "@/components/SeletorIdioma";
import ModoMontra from "@/components/ModoMontra";
import Portal from "@/components/Portal";
import ContadorPremios from "@/components/ContadorPremios";
import FaixaSelos from "@/components/FaixaSelos";
import { idiomaInicial, t, type Idioma } from "@/lib/i18n";
import { SEGUNDOS_MONTRA, MOSTRAR_SELOS } from "@/lib/config";
import { useEcraSempreAceso } from "@/lib/useEcraSempreAceso";

export default function Pagina() {
  const [idioma, setIdioma] = useState<Idioma>("en");
  const [montra, setMontra] = useState(false);
  const ocupadaRef = useRef(false);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // o tablet do stand nunca adormece (ver lib/useEcraSempreAceso.ts)
  useEcraSempreAceso();

  // idioma inicial: o DA FEIRA (config), não o do browser do tablet.
  // Só no cliente, para evitar mismatch de SSR.
  useEffect(() => {
    setIdioma(idiomaInicial());
  }, []);

  // o <html lang> acompanha o idioma ativo (semântica e leitores de ecrã)
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  const rearmarTemporizador = useCallback(() => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => {
      if (ocupadaRef.current) return;
      setMontra(true);
      // sessão terminada: volta ao idioma da feira, para que o próximo
      // visitante nunca apanhe o ecrã na língua que o anterior escolheu
      setIdioma(idiomaInicial());
    }, SEGUNDOS_MONTRA * 1000);
  }, []);

  useEffect(() => {
    const acordar = () => {
      setMontra(false);
      rearmarTemporizador();
    };
    window.addEventListener("pointerdown", acordar);
    window.addEventListener("keydown", acordar);
    rearmarTemporizador();
    return () => {
      window.removeEventListener("pointerdown", acordar);
      window.removeEventListener("keydown", acordar);
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    };
  }, [rearmarTemporizador]);

  const aoOcupadaChange = useCallback(
    (ocupada: boolean) => {
      ocupadaRef.current = ocupada;
      if (ocupada) {
        setMontra(false);
        if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
      } else {
        rearmarTemporizador();
      }
    },
    [rearmarTemporizador]
  );

  return (
    <main className="pagina">
      <header className="cabecalho">
        <img
          src="/logo-claro.png"
          alt="Visit Braga"
          className="cabecalho-logo"
          width={1400}
          height={222}
        />
        <p className="cabecalho-tagline">{t("tagline", idioma)}</p>
        {/* divisor zigzag fino - o escadório como assinatura discreta */}
        <div className="cabecalho-zig" aria-hidden="true" />
        <SeletorIdioma idioma={idioma} aoMudar={setIdioma} />
      </header>

      <Roleta idioma={idioma} montra={montra} onOcupadaChange={aoOcupadaChange} />

      {/* faixa institucional: prova de destino a quem só veio pelo prémio */}
      {MOSTRAR_SELOS ? <FaixaSelos idioma={idioma} /> : null}

      {/* RODAPÉ: a base zigzag deixou de ser um elemento fixo a flutuar
          por cima de tudo - é uma LINHA da grelha, com o contador dentro.
          Assim reserva o seu espaço e nunca tapa os selos nem a mascote. */}
      <footer className="rodape">
        <div className="rodape-zig" aria-hidden="true" />
        <div className="rodape-conteudo">
          <ContadorPremios idioma={idioma} />
        </div>
      </footer>

      {montra ? (
        <Portal>
          <ModoMontra idioma={idioma} />
        </Portal>
      ) : null}
    </main>
  );
}
