"use client";

/**
 * MODO MONTRA - o farol do corredor
 * Ao fim de ~45 s sem toques, o ecrã inteiro fica vermelho, o sino
 * badala e o CTA pulsa nas 3 línguas. É a única altura em que o
 * vermelho toma o ecrã todo - por isso funciona.
 */

import { useEffect, useState } from "react";
import { MONTRA_CTA, T, IDIOMAS, type Idioma } from "@/lib/i18n";

export default function Montra() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % IDIOMAS.length), 2200);
    return () => clearInterval(t);
  }, []);
  const lingua: Idioma = IDIOMAS[i].codigo;

  return (
    <div className="veu montra" aria-hidden="true">
      <div className="veu-raios" />
      <div className="montra-corpo">
        <img src="/sino-braga-branco.png" alt="" className="montra-sino" />
        <p className="montra-cta" key={i}>
          {MONTRA_CTA[0][lingua]}
        </p>
        <p className="montra-toca">
          {T.montraToca.pt} · {T.montraToca.es} · {T.montraToca.en}
        </p>
      </div>
    </div>
  );
}
