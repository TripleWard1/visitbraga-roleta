"use client";

/**
 * SELETOR DE IDIOMA - PT / ES / EN
 * Sempre visível no canto superior; troca instantânea, sem recarregar.
 */

import { IDIOMAS, type Idioma } from "@/lib/i18n";

type Props = {
  idioma: Idioma;
  aoMudar: (i: Idioma) => void;
};

export default function SeletorIdioma({ idioma, aoMudar }: Props) {
  return (
    <div className="seletor-idioma" role="group" aria-label="Idioma / Language">
      {IDIOMAS.map((i) => (
        <button
          key={i.codigo}
          className={
            "seletor-idioma-botao" + (i.codigo === idioma ? " ativo" : "")
          }
          onClick={() => aoMudar(i.codigo)}
          aria-pressed={i.codigo === idioma}
        >
          {i.rotulo}
        </button>
      ))}
    </div>
  );
}
