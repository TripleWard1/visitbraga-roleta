/**
 * SELOS DE PRESTÍGIO DO DESTINO
 * ------------------------------
 * A razão de ser desta app não é o sticker: é Braga. Estes selos ocupam
 * a faixa institucional sob o botão e garantem que MESMO quem só passou
 * para girar leva três provas de que Braga vale a viagem.
 *
 * Regra de ouro: no máximo 3–4 e todos verificáveis. Nada de superlativos
 * vazios ("cidade mágica") - só factos que aguentam escrutínio.
 *
 * Editáveis à vontade por feira/época.
 */

import type { TextoML } from "./i18n";

export type Selo = { forte: TextoML; leve: TextoML };

export const SELOS: Selo[] = [
  {
    forte: { pt: "Bom Jesus do Monte", es: "Bom Jesus do Monte", en: "Bom Jesus do Monte" },
    leve: {
      pt: "Património Mundial UNESCO",
      es: "Patrimonio Mundial UNESCO",
      en: "UNESCO World Heritage",
    },
  },
  {
    forte: {
      pt: "Melhor Destino Europeu",
      es: "Mejor Destino Europeo",
      en: "European Best Destination",
    },
    leve: { pt: "2021", es: "2021", en: "2021" },
  },
  {
    forte: { pt: "2000 anos", es: "2000 años", en: "2,000 years" },
    leve: {
      pt: "A cidade mais antiga do país",
      es: "La ciudad más antigua del país",
      en: "The country's oldest city",
    },
  },
];
