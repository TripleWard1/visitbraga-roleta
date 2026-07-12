/**
 * SINO DA MARCA - vetor
 * ----------------------
 * O sino oficial (o "a" de BRAGA no logótipo), vetorizado a partir do PNG
 * da marca com 99,3% de fidelidade. Passa a SVG inline, o que resolve três
 * problemas de uma vez:
 *   1. não pode dar 404 nem "imagem partida" (era o que acontecia dentro
 *      dos overlays em portal)
 *   2. fica nítido em qualquer tamanho - do selo de 15 px ao sino gigante
 *      do modo montra
 *   3. recebe a cor por CSS (currentColor): um só componente serve o
 *      vermelho, o branco e o preto
 */

export default function Sino({
  className,
  tamanho,
}: {
  className?: string;
  tamanho?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 222"
      width={tamanho}
      height={tamanho ? Math.round((tamanho * 222) / 200) : undefined}
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M86 2L114 2L114 21L116 23L124 25L138 33L148 43L153 50L160 68L162 103L166 118L171 128L189 154L193 164L195 173L196 198L115 198L114 199L114 219L86 219L86 200L84 198L4 198L4 177L7 162L12 151L28 129L36 110L37 99L38 98L39 70L43 57L50 45L59 35L69 28L86 21ZM94 54L109 55L118 60L124 67L127 75L128 101L132 122L135 131L142 145L156 164L156 165L106 165L43 165L58 144L67 123L71 104L72 76L74 70L76 66L84 58Z" />
    </svg>
  );
}
