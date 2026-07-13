"use client";

/**
 * BRACVS - a mascote NUNCA desaparece
 * -------------------------------------
 * Escondê-la durante o giro era o pior timing possível: é a cara da app e
 * o giro é o momento que interessa. O conflito de layout resolve-se com
 * ESPAÇO PRÓPRIO (ela é uma célula da grelha, não uma sobreposição), não
 * apagando a personagem. Em ecrãs pequenos encolhe - nunca some.
 *
 * E ganha papel ATIVO: durante o giro está MAIS presente, não menos.
 *   repouso  → respira devagar
 *   giro     → saltinhos, inclina-se para a roda
 *   suspense → congela e encolhe-se (o instante antes da revelação)
 *   vitoria  → festeja aos pulos
 *   derrota  → encolhe os ombros, cabeça a descair
 *
 * A sombra de contacto obedece a cada estado (encolhe quando ele salta):
 * é isso que vende a ilusão de peso.
 */

export type Fase = "repouso" | "giro" | "suspense" | "vitoria" | "derrota";

export default function Bracvs({ fase }: { fase: Fase }) {
  return (
    <div className={`bracvs bracvs-${fase}`}>
      <div className="bracvs-corpo">
        <img
          src="/mascote-bracvs.png"
          alt="Bracvs, a mascote de Braga"
          width={272}
          height={442}
          draggable={false}
        />
      </div>
      <span className="bracvs-sombra" aria-hidden="true" />
    </div>
  );
}
