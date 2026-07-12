"use client";

/**
 * PERGUNTA-RELÂMPAGO - "De onde nos visitas?"
 * -------------------------------------------
 * 1 toque numa bandeira (ou "Saltar") e a roleta gira logo a seguir.
 * A resposta é guardada nas estatísticas do Firestore por feira -
 * dá dados de visitantes para o relatório da Divisão sem criar atrito.
 * Desativa-se em lib/config.ts (PERGUNTA_ORIGEM = false).
 */

import { ORIGENS } from "@/lib/config";
import { registarOrigem } from "@/lib/stock";
import { t, type Idioma } from "@/lib/i18n";

type Props = {
  idioma: Idioma;
  aoResponder: () => void; // chamado quer responda quer salte
};

export default function PerguntaOrigem({ idioma, aoResponder }: Props) {
  return (
    <div className="resultado-veu" role="dialog" aria-modal="true">
      <div className="origem-cartao">
        <h2 className="origem-titulo">{t("origemTitulo", idioma)}</h2>
        <div className="origem-grelha">
          {ORIGENS.map((o) => (
            <button
              key={o.codigo}
              className="origem-opcao"
              onClick={() => {
                registarOrigem(o.codigo);
                aoResponder();
              }}
            >
              <span className="origem-bandeira">{o.bandeira}</span>
              <span className="origem-nome">
                {o.codigo === "outro" ? t("origemOutro", idioma) : o.nome}
              </span>
            </button>
          ))}
        </div>
        <button className="origem-saltar" onClick={aoResponder}>
          {t("origemSaltar", idioma)}
        </button>
      </div>
    </div>
  );
}
