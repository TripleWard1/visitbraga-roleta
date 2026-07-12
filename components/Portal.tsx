"use client";

/**
 * PORTAL - a correção de raiz do empilhamento
 * --------------------------------------------
 * Um elemento `position: fixed` NÃO é relativo ao viewport se algum
 * antepassado criar um stacking context (z-index + position, transform,
 * filter...). O `.palco` tem z-index - e por isso os overlays (bilhete,
 * pergunta, modo montra) ficavam presos nesse contexto, com o cabeçalho,
 * os selos, a base e o seletor de idiomas a pintar POR CIMA do véu.
 *
 * Solução definitiva: renderizar os overlays diretamente no <body>, fora
 * de qualquer contexto. Assim, um overlay cobre SEMPRE o ecrã inteiro,
 * independentemente de onde é chamado na árvore.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false);

  // só no cliente: no servidor não há document (evita erro de SSR)
  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado) return null;
  return createPortal(children, document.body);
}
