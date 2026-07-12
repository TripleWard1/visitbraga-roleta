"use client";

/**
 * CONTADOR PÚBLICO DE PRÉMIOS ENTREGUES
 * -------------------------------------
 * Prova social alimentada pelo Firestore. Pluralização correta:
 * "1 prémio já entregue" / "12 prémios já entregues" (idem ES/EN).
 * Escondido enquanto for 0.
 */

import { useEffect, useState } from "react";
import { subscreverStats } from "@/lib/stock";
import { fraseContador, type Idioma } from "@/lib/i18n";

export default function ContadorPremios({ idioma }: { idioma: Idioma }) {
  const [entregues, setEntregues] = useState(0);

  useEffect(() => {
    return subscreverStats((s) => setEntregues(s.entregues));
  }, []);

  if (entregues <= 0) return null;

  return <p className="contador-premios">{fraseContador(entregues, idioma)}</p>;
}
