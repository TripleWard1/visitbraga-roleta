"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEGUNDOS_MONTRA } from "./config";

/**
 * ECRÃ SEMPRE ACESO (Screen Wake Lock)
 * O bug nº1 de qualquer quiosque: o tablet adormece nas horas mortas -
 * logo quando o modo montra devia estar a chamar gente. Readquire o
 * bloqueio ao voltar de segundo plano. Falha em silêncio sem suporte.
 * (No iPad, põe também "Bloqueio automático: Nunca" nas definições.)
 */
type Sentinela = { release: () => Promise<void> };
type NavWL = Navigator & {
  wakeLock?: { request: (t: "screen") => Promise<Sentinela> };
};

export function useEcraSempreAceso() {
  useEffect(() => {
    const nav = navigator as NavWL;
    if (!nav.wakeLock) return;
    let vivo = true;
    let sentinela: Sentinela | null = null;

    const pedir = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        const s = await nav.wakeLock!.request("screen");
        if (!vivo) {
          s.release().catch(() => {});
          return;
        }
        sentinela = s;
      } catch {
        /* recusado (bateria fraca): seguimos */
      }
    };

    const aoVoltar = () => {
      if (document.visibilityState === "visible") pedir();
    };

    pedir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      sentinela?.release().catch(() => {});
    };
  }, []);
}

/**
 * INATIVIDADE → MODO MONTRA
 * `ocupado` = há um giro/resultado/pergunta a decorrer: o temporizador
 * não corre. Qualquer toque acorda e rearma.
 */
export function useInatividade(ocupado: boolean) {
  const [montra, setMontra] = useState(false);
  const [sessao, setSessao] = useState(0); // muda quando entra em montra
  const ocupadoRef = useRef(ocupado);
  const tempoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  ocupadoRef.current = ocupado;

  const rearmar = useCallback(() => {
    if (tempoRef.current) clearTimeout(tempoRef.current);
    tempoRef.current = setTimeout(() => {
      if (ocupadoRef.current) return;
      setMontra(true);
      setSessao((s) => s + 1); // sinal para repor o idioma da feira
    }, SEGUNDOS_MONTRA * 1000);
  }, []);

  useEffect(() => {
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
      if (tempoRef.current) clearTimeout(tempoRef.current);
    };
  }, [rearmar]);

  useEffect(() => {
    if (ocupado) {
      setMontra(false);
      if (tempoRef.current) clearTimeout(tempoRef.current);
    } else {
      rearmar();
    }
  }, [ocupado, rearmar]);

  return { montra, sessao };
}
