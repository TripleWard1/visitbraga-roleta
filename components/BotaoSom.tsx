"use client";

/**
 * BOTÃO DE SILÊNCIO - persistente
 * Num stand, se a equipa desligar o som (porque o pavilhão já é barulhento
 * ou porque o diretor está a fazer uma reunião ao lado), tem de ficar
 * desligado depois de recarregar a página.
 */

import { useEffect, useState } from "react";
import { alternarSom, estaSilenciado, ouvirSom } from "@/lib/audio";

export default function BotaoSom() {
  const [mudo, setMudo] = useState(false);

  useEffect(() => {
    setMudo(estaSilenciado());
    return ouvirSom(setMudo);
  }, []);

  return (
    <button
      className="botao-som"
      onClick={() => setMudo(alternarSom())}
      aria-label={mudo ? "Ligar som" : "Desligar som"}
      title={mudo ? "Ligar som" : "Desligar som"}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {mudo ? (
          <path d="M17 9l4 6M21 9l-4 6" />
        ) : (
          <path d="M17 8a5 5 0 0 1 0 8" />
        )}
      </svg>
    </button>
  );
}
