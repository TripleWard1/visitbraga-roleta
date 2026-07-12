"use client";

/**
 * FAIXA DE SELOS DE DESTINO
 * --------------------------
 * Ocupa a faixa institucional entre o botão e a base zigzag — o espaço
 * que antes era vazio. Cada selo é uma prova verificável de que Braga
 * merece a viagem, no idioma do visitante. Discreta por desenho: quem
 * está a jogar não é distraído; quem espera na fila, lê.
 */

import { SELOS } from "@/lib/selos";
import type { Idioma } from "@/lib/i18n";
import Sino from "./Sino";

export default function FaixaSelos({ idioma }: { idioma: Idioma }) {
  return (
    <div className="faixa-selos">
      {SELOS.map((s, i) => (
        <div className="selo" key={i}>
          <Sino className="selo-sino" />
          <p className="selo-texto">
            <span className="selo-forte">{s.forte[idioma]}</span>
            <span className="selo-leve">{s.leve[idioma]}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
