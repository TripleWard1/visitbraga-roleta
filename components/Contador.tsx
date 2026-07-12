"use client";

import { useEffect, useState } from "react";
import { subscreverStats } from "@/lib/stock";
import { fraseContador, type Idioma } from "@/lib/i18n";

export default function Contador({ idioma }: { idioma: Idioma }) {
  const [n, setN] = useState(0);
  useEffect(() => subscreverStats((s) => setN(s.entregues)), []);
  if (n <= 0) return null;
  return (
    <p className="contador">
      <span className="contador-ponto" />
      {fraseContador(n, idioma)}
    </p>
  );
}
