"use client";

/**
 * FUNDO - campo limpo
 * ---------------------
 * As silhuetas do património saíram. Funcionavam no render 16:9, mas no
 * ecrã real (que é 21:9 ou 9:19) o SVG é esticado e cortado, e as formas
 * viram manchas. Insistir era teimosia.
 *
 * O que fica é o que um estúdio faria: um campo quente, um chão com
 * horizonte, uma luz de palco sobre a roda e grão de impressão. A energia
 * vive na roleta, no botão e no plinto - não no fundo.
 */

export default function FundoCartaz({
  variante = "creme",
}: {
  variante?: "creme" | "vermelho";
}) {
  return (
    <div className={"fundo fundo-" + variante} aria-hidden="true">
      <div className="fundo-grao" />
    </div>
  );
}
