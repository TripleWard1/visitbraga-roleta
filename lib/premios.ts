/**
 * PRÉMIOS — CONFIGURAÇÃO (PLACEHOLDERS: edita quando tiveres a lista final)
 * -------------------------------------------------------------------------
 * id     → identificador único (não repetir!) — é a chave do stock no Firestore
 * linha1 → 1.ª linha na fatia, nas 3 línguas (curto! máx. ~10 caracteres)
 * linha2 → (opcional) 2.ª linha, nas 3 línguas
 * peso   → probabilidade relativa (maior = sai mais vezes)
 * ganha  → false para fatias "Sem sorte desta vez"
 * stock  → unidades disponíveis; null = ilimitado (usa null nas fatias sem prémio)
 * icone  → ícone do conjunto próprio (lib/icones.tsx): "estrela", "mapa",
 *          "pin", "autocolante", "brinde", "bilhete", "sino", "sem-sorte"
 * destaque → true no PRÉMIO-HERÓI da feira (ex.: uma experiência em Braga).
 *            A fatia ganha tratamento visual próprio (vermelho profundo,
 *            estrela e brilho) — é o que cria fila no stand. Usa em UM só.
 *
 * NOTA: o stock aqui é o stock INICIAL desta feira. Depois do primeiro
 * arranque, o stock real vive no Firestore (documento roletas/{FEIRA_ID})
 * e gere-se ao vivo na página /admin. Se mudares os valores iniciais aqui,
 * usa "Repor stock inicial" no /admin para os aplicar.
 */

import type { TextoML } from "./i18n";
import type { NomeIcone } from "./icones";

export type Premio = {
  id: string;
  linha1: TextoML;
  linha2?: TextoML;
  peso: number;
  ganha: boolean;
  stock: number | null;
  destaque?: boolean;
  /** ícone do conjunto próprio (lib/icones.tsx) — aparece no bilhete */
  icone: NomeIcone;
};

const SEM_SORTE: { linha1: TextoML; linha2: TextoML; icone: NomeIcone } = {
  icone: "sem-sorte",
  linha1: { pt: "SEM SORTE", es: "SIN SUERTE", en: "NO LUCK" },
  linha2: { pt: "DESTA VEZ", es: "ESTA VEZ", en: "THIS TIME" },
};

export const PREMIOS: Premio[] = [
  {
    id: "surpresa",
    linha1: { pt: "PRÉMIO", es: "PREMIO", en: "MYSTERY" },
    linha2: { pt: "SURPRESA", es: "SORPRESA", en: "PRIZE" },
    peso: 2,
    ganha: true,
    stock: 10,
    icone: "estrela",
    destaque: true, // ⭐ prémio-herói: troca por uma experiência real em Braga
  },
  {
    id: "guia",
    linha1: { pt: "MAPA &", es: "MAPA &", en: "MAP &" },
    linha2: { pt: "GUIA", es: "GUÍA", en: "GUIDE" },
    peso: 5,
    ganha: true,
    stock: 40,
    icone: "mapa",
  },
  { id: "semsorte1", ...SEM_SORTE, peso: 4, ganha: false, stock: null },
  {
    id: "pin",
    linha1: { pt: "PIN", es: "PIN", en: "PIN" },
    linha2: { pt: "BRAGA", es: "BRAGA", en: "BRAGA" },
    peso: 4,
    ganha: true,
    stock: 30,
    icone: "pin",
  },
  {
    id: "sticker",
    linha1: { pt: "STICKER", es: "PEGATINA", en: "STICKER" },
    linha2: { pt: "BRACVS", es: "BRACVS", en: "BRACVS" },
    peso: 5,
    ganha: true,
    stock: 60,
    icone: "autocolante",
  },
  { id: "semsorte2", ...SEM_SORTE, peso: 4, ganha: false, stock: null },
  {
    id: "brinde",
    linha1: { pt: "BRINDE", es: "REGALO", en: "GIFT" },
    linha2: { pt: "VISIT BRAGA", es: "VISIT BRAGA", en: "VISIT BRAGA" },
    peso: 5,
    ganha: true,
    stock: 50,
    icone: "brinde",
  },
  {
    id: "oferta",
    linha1: { pt: "OFERTA", es: "OFERTA", en: "SPECIAL" },
    linha2: { pt: "ESPECIAL", es: "ESPECIAL", en: "OFFER" },
    peso: 3,
    ganha: true,
    stock: 15,
    icone: "bilhete",
  },
];

/** mapa { id: stock } com os valores iniciais acima */
export function stockInicial(): Record<string, number | null> {
  const s: Record<string, number | null> = {};
  for (const p of PREMIOS) s[p.id] = p.stock;
  return s;
}
