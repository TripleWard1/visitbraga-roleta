/**
 * ÍCONES DOS PRÉMIOS - desenhados de raiz para esta marca
 * --------------------------------------------------------
 * Nada de bibliotecas de ícones genéricos (lucide, fontawesome...): a
 * linguagem do logótipo Visit Braga é geométrica, de traço grosso e
 * cortes rectos, e um ícone de biblioteca destoaria à légua.
 *
 * Regras do conjunto (é isto que faz um conjunto parecer um conjunto):
 * - grelha de 24×24, traço de 2 px, extremidades rectas
 * - `currentColor` em tudo → herdam a cor do contexto
 * - silhuetas fechadas e simples, legíveis a 16 px e a 120 px
 */

export type NomeIcone =
  | "estrela"
  | "mapa"
  | "pin"
  | "autocolante"
  | "brinde"
  | "bilhete"
  | "sino"
  | "sem-sorte";

type Props = { className?: string; tamanho?: number };

const base = (tamanho: number) => ({
  width: tamanho,
  height: tamanho,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
});

export function Icone({
  nome,
  className,
  tamanho = 24,
}: Props & { nome: NomeIcone }) {
  const p = { ...base(tamanho), className, "aria-hidden": true };

  switch (nome) {
    case "estrela": // prémio-herói
      return (
        <svg {...p}>
          <path d="M12 2.5 L14.9 9.1 L22 9.8 L16.7 14.6 L18.2 21.5 L12 17.9 L5.8 21.5 L7.3 14.6 L2 9.8 L9.1 9.1 Z" />
        </svg>
      );
    case "mapa": // mapa & guia
      return (
        <svg {...p}>
          <path d="M2 6 L9 3 L15 6 L22 3 L22 18 L15 21 L9 18 L2 21 Z" />
          <path d="M9 3 L9 18" />
          <path d="M15 6 L15 21" />
        </svg>
      );
    case "pin": // pin de lapela
      return (
        <svg {...p}>
          <path d="M12 22 L12 14" />
          <path d="M5.5 14 L18.5 14 L15.5 9 L15.5 2 L8.5 2 L8.5 9 Z" />
        </svg>
      );
    case "autocolante": // sticker com canto dobrado
      return (
        <svg {...p}>
          <path d="M3 3 L21 3 L21 14 L14 21 L3 21 Z" />
          <path d="M21 14 L14 14 L14 21" />
        </svg>
      );
    case "brinde": // caixa com laço
      return (
        <svg {...p}>
          <path d="M2 8 L22 8 L22 21 L2 21 Z" />
          <path d="M12 8 L12 21" />
          <path d="M12 8 C12 8 8 8 6.5 6.5 C5 5 6 2.5 8 3 C10 3.5 12 8 12 8 Z" />
          <path d="M12 8 C12 8 16 8 17.5 6.5 C19 5 18 2.5 16 3 C14 3.5 12 8 12 8 Z" />
        </svg>
      );
    case "bilhete": // oferta especial / voucher
      return (
        <svg {...p}>
          <path d="M2 6 L22 6 L22 10 A2 2 0 0 0 22 14 L22 18 L2 18 L2 14 A2 2 0 0 0 2 10 Z" />
          <path d="M9 6 L9 18" strokeDasharray="2 3" />
        </svg>
      );
    case "sino": // o sino da marca, em traço
      return (
        <svg {...p}>
          <path d="M12 3 C7.5 3 6 7 6 11 L6 16 L18 16 L18 11 C18 7 16.5 3 12 3 Z" />
          <path d="M12 1.5 L12 3" />
          <path d="M12 16 L12 19" />
          <path d="M4 19 L20 19" />
        </svg>
      );
    case "sem-sorte": // seta de "volta a passar por cá"
      return (
        <svg {...p}>
          <path d="M20 12 A8 8 0 1 1 12 4" />
          <path d="M12 1 L12 7 L18 7" transform="rotate(-45 12 4)" />
        </svg>
      );
  }
}
