/**
 * TRADUÇÕES - português de Portugal · español · English
 * ------------------------------------------------------
 * Todo o texto da interface vive aqui. Para afinar uma frase,
 * edita apenas este ficheiro.
 */

import { IDIOMA_POR_OMISSAO } from "./config";

export type Idioma = "pt" | "es" | "en";
export type TextoML = { pt: string; es: string; en: string };

export const IDIOMAS: { codigo: Idioma; rotulo: string }[] = [
  { codigo: "pt", rotulo: "PT" },
  { codigo: "es", rotulo: "ES" },
  { codigo: "en", rotulo: "EN" },
];

/**
 * Idioma inicial da sessão.
 *
 * IMPORTANTE: num stand, o tablet é do Município (browser em português),
 * por isso a deteção pelo browser daria PT... em Madrid. Se a feira tiver
 * IDIOMA_POR_OMISSAO definido em lib/config.ts, é ESSE que manda. Só na
 * ausência dele (app aberta no telemóvel do visitante) vale o browser.
 */
export function idiomaInicial(): Idioma {
  if (IDIOMA_POR_OMISSAO) return IDIOMA_POR_OMISSAO;
  if (typeof navigator === "undefined") return "en";
  const l = (navigator.language || "en").toLowerCase();
  if (l.indexOf("pt") === 0) return "pt";
  if (l.indexOf("es") === 0 || l.indexOf("ca") === 0 || l.indexOf("gl") === 0)
    return "es";
  return "en";
}

export const T = {
  tagline: {
    pt: "A cidade mais antiga de Portugal",
    es: "La ciudad más antigua de Portugal",
    en: "The oldest city in Portugal",
  },
  titulo: {
    pt: "Roda da Sorte",
    es: "Rueda de la Suerte",
    en: "Wheel of Fortune",
  },
  girar: { pt: "GIRAR", es: "¡GIRA!", en: "SPIN" },
  aGirar: { pt: "Boa sorte!", es: "¡Buena suerte!", en: "Good luck!" },
  sabiasQue: { pt: "Sabias que…?", es: "¿Sabías que…?", en: "Did you know…?" },
  mostraEquipa: {
    pt: "Mostra este ecrã à equipa do stand para receberes o teu prémio",
    es: "Muestra esta pantalla al equipo del stand para recibir tu premio",
    en: "Show this screen to our stand team to collect your prize",
  },
  esgotado: { pt: "ESGOTADO", es: "AGOTADO", en: "SOLD OUT" },
  entregueManter: {
    pt: "Manter premido…",
    es: "Mantén pulsado…",
    en: "Keep holding…",
  },
  entregue: {
    pt: "✓ Entregue (equipa)",
    es: "✓ Entregado (equipo)",
    en: "✓ Delivered (staff)",
  },
  fechar: { pt: "Fechar", es: "Cerrar", en: "Close" },
  levaBraga: {
    pt: "Leva Braga contigo",
    es: "Llévate Braga contigo",
    en: "Take Braga with you",
  },
  derrota: {
    pt: "Sem sorte desta vez… mas Braga espera por ti!",
    es: "Sin suerte esta vez… ¡pero Braga te espera!",
    en: "No luck this time… but Braga is waiting for you!",
  },
  origemTitulo: {
    pt: "De onde nos visitas?",
    es: "¿De dónde nos visitas?",
    en: "Where are you visiting from?",
  },
  origemSaltar: { pt: "Saltar →", es: "Saltar →", en: "Skip →" },
  origemOutro: { pt: "Outro", es: "Otro", en: "Other" },
  montraToca: {
    pt: "Toca no ecrã para jogar",
    es: "Toca la pantalla para jugar",
    en: "Tap the screen to play",
  },
  regraCasa: {
    pt: "1 giro por visitante · prémios até esgotar",
    es: "1 giro por visitante · premios hasta agotar existencias",
    en: "One spin per visitor · prizes while stocks last",
  },
} as const;

export type ChaveT = keyof typeof T;

/** Atalho: t("girar", idioma) */
export function t(chave: ChaveT, idioma: Idioma): string {
  return T[chave][idioma];
}

/** Frases do modo montra (Vermelho Total), alternadas nas 3 línguas. */
export const MONTRA_CTA: string[] = [
  "GIRA E GANHA!",
  "¡GIRA Y GANA!",
  "SPIN & WIN!",
];

/**
 * Contador público com pluralização correta nas 3 línguas.
 * 1 → "1 prémio já entregue…" · n → "n prémios já entregues…"
 */
export function fraseContador(n: number, idioma: Idioma): string {
  if (idioma === "pt") {
    return n === 1
      ? "Já entregámos 1 prémio nesta feira!"
      : "Já entregámos " + n + " prémios nesta feira!";
  }
  if (idioma === "es") {
    return n === 1
      ? "¡Ya hemos entregado 1 premio en esta feria!"
      : "¡Ya hemos entregado " + n + " premios en esta feria!";
  }
  return n === 1
    ? "1 prize already given away at this fair!"
    : n + " prizes already given away at this fair!";
}

/** Mensagens de festejo (uma ao acaso quando alguém ganha). */
export const MENSAGENS_VITORIA: TextoML[] = [
  {
    pt: "Parabéns! Ganhaste:",
    es: "¡Enhorabuena! Has ganado:",
    en: "Congratulations! You've won:",
  },
  {
    pt: "Braga sorriu-te! O teu prémio:",
    es: "¡Braga te sonríe! Tu premio:",
    en: "Braga smiled at you! Your prize:",
  },
  {
    pt: "O sino tocou por ti! Levas:",
    es: "¡La campana sonó por ti! Te llevas:",
    en: "The bell rang for you! You take home:",
  },
];
