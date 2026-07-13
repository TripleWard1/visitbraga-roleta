"use client";

/**
 * FUNDO - A FÓRMULA DO CARTAZ
 * ----------------------------
 * Não são "elementos decorativos". É a fórmula de um cartaz impresso:
 *
 *   1. UM campo de cor, de canto a canto
 *   2. Silhuetas ENORMES em tom-sobre-tom (a mesma cor, apenas mais
 *      escura/tostada), densas, a tocarem-se, a sobreporem-se e cortadas
 *      pelas margens - meia Sé a sair pelo canto é bom
 *   3. Grão de impressão por cima
 *   4. E mais nada
 *
 * A força nasce de ESCALA + DENSIDADE + BAIXÍSSIMO CONTRASTE. O erro que
 * se comete sempre é o inverso: elementos pequenos, esparsos e tímidos.
 *
 * Contraste medido (é aqui que isto vive ou morre):
 *   creme    campo #faf8f4 → silhuetas 1.14:1 e 1.28:1
 *   vermelho campo #e00009 → silhuetas 1.24:1 e 1.56:1
 * A janela do cartaz é 1.1–1.4:1. Acima de 2:1 deixa de ser textura e
 * passa a desenho. NUNCA "vermelho a 5% sobre creme" - lê-se como mancha.
 *
 * Cobertura: 62% do ecrã, 16 silhuetas.
 */

import { SILHUETAS_CLARAS, SILHUETAS_ESCURAS } from "@/lib/silhuetas";

type Props = {
  /** "creme" = ecrã principal · "vermelho" = modo montra (o cartaz puro) */
  variante?: "creme" | "vermelho";
};

/* TOM-SOBRE-TOM. No ecrã real as silhuetas liam-se como manchas: os tons
   estavam demasiado afastados do campo. Baixados para a janela do cartaz
   (contraste 1.08:1 e 1.17:1) - presentes ao perto, invisíveis ao longe. */
const PALETA = {
  creme: { campo: "#faf8f4", claro: "#f5efe4", escuro: "#eee6d6" },
  vermelho: { campo: "#e00009", claro: "#cf0008", escuro: "#b60007" },
};

export default function FundoCartaz({ variante = "creme" }: Props) {
  const p = PALETA[variante];

  return (
    <div className={"fundo fundo-" + variante} aria-hidden="true">
      <svg
        className="fundo-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <rect x="0" y="0" width="1600" height="900" fill={p.campo} />

        {/* nível de trás: o tom mais escuro */}
        <g fill={p.escuro} fillRule="evenodd">
          {SILHUETAS_ESCURAS.map((d, i) => (
            <path key={"e" + i} d={d} />
          ))}
        </g>

        {/* nível da frente: o tom mais claro (dá profundidade à textura) */}
        <g fill={p.claro} fillRule="evenodd">
          {SILHUETAS_CLARAS.map((d, i) => (
            <path key={"c" + i} d={d} />
          ))}
        </g>
      </svg>

      {/* grão de impressão (3%), por cima de tudo */}
      <div className="fundo-grao" />
    </div>
  );
}
