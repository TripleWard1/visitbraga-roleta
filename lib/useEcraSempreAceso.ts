"use client";

/**
 * ECRÃ SEMPRE ACORDADO (Screen Wake Lock API)
 * --------------------------------------------
 * O bug nº1 de qualquer quiosque: ao fim de alguns minutos sem toques,
 * o tablet apaga o ecrã e o stand fica morto — logo nos períodos de
 * pouco movimento, que são exatamente aqueles em que o modo montra
 * deveria estar a chamar gente.
 *
 * Este hook mantém o ecrã ligado enquanto a app estiver visível e
 * READQUIRE o bloqueio quando o separador volta a ficar visível (o
 * sistema liberta-o sozinho ao minimizar). Falha em silêncio nos
 * browsers sem suporte — nunca parte a app.
 *
 * Nota para o stand: em iPad/Safari o suporte é irregular; garante
 * também "Bloqueio automático: Nunca" nas definições do tablet.
 */

import { useEffect, useRef } from "react";

type SentinelaWakeLock = {
  release: () => Promise<void>;
  addEventListener?: (tipo: string, ouvinte: () => void) => void;
};

type NavigatorComWakeLock = Navigator & {
  wakeLock?: { request: (tipo: "screen") => Promise<SentinelaWakeLock> };
};

export function useEcraSempreAceso() {
  const sentinelaRef = useRef<SentinelaWakeLock | null>(null);

  useEffect(() => {
    const nav = navigator as NavigatorComWakeLock;
    if (!nav.wakeLock) return; // sem suporte: falha em silêncio

    let cancelado = false;

    const pedir = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        const sentinela = await nav.wakeLock!.request("screen");
        if (cancelado) {
          sentinela.release().catch(() => {});
          return;
        }
        sentinelaRef.current = sentinela;
      } catch {
        /* recusado pelo sistema (ex.: bateria fraca) — seguimos na mesma */
      }
    };

    // o sistema liberta o bloqueio ao minimizar: readquirir ao voltar
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") pedir();
    };

    pedir();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      sentinelaRef.current?.release().catch(() => {});
      sentinelaRef.current = null;
    };
  }, []);
}
