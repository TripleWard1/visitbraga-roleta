/**
 * FOTOGRAFIA DO DESTINO - alojada fora do projeto
 * -------------------------------------------------
 * As fotos NÃO vivem em /public (o StackBlitz tem limite de espaço):
 * são servidas por URL. Vantagem extra: trocar as fotos de uma feira
 * para a outra não obriga a novo deploy - muda-se o URL e pronto.
 *
 * ORDEM (confirmada pelo Hugo a partir do ecrã):
 *   wJ7SN6Z = Bom Jesus · Vt4acFK = Museu · IA7y5fO = Sé
 *
 * ⚠️ REDE: se o wi-fi da feira falhar, as fotos não carregam. A app
 * deteta isso e volta sozinha à versão gráfica (Vermelho Total com o
 * sino) - nunca aparece um espaço vazio nem um ícone de imagem partida
 * no stand. Ver components/ModoMontra.tsx.
 *
 * 💡 A PRAZO: o ideal é alojá-las no portal Visit Braga (ou noutro
 * domínio do Município) em vez do imgur - é serviço de terceiros, sem
 * garantias, e um dia pode simplesmente deixar de servir a imagem.
 */

export const FOTOS_ATIVAS = true;

export type Foto = {
  ficheiro: string; // URL (ou caminho em /public)
  local: { pt: string; es: string; en: string }; // legenda que VENDE
};

export const FOTOS: Foto[] = [
  {
    ficheiro: "https://i.imgur.com/wJ7SN6Z.jpeg",
    local: {
      pt: "Bom Jesus do Monte · Património Mundial UNESCO",
      es: "Bom Jesus do Monte · Patrimonio Mundial UNESCO",
      en: "Bom Jesus do Monte · UNESCO World Heritage",
    },
  },
  {
    ficheiro: "https://i.imgur.com/Vt4acFK.jpeg",
    local: {
      pt: "Museu D. Diogo de Sousa · Bracara Augusta",
      es: "Museo D. Diogo de Sousa · Bracara Augusta",
      en: "D. Diogo de Sousa Museum · Bracara Augusta",
    },
  },
  {
    ficheiro: "https://i.imgur.com/IA7y5fO.jpeg",
    local: {
      pt: "Sé de Braga · A catedral mais antiga do país",
      es: "Catedral de Braga · La más antigua del país",
      en: "Braga Cathedral · The country's oldest",
    },
  },
];

/** segundos que cada fotografia fica no ecrã */
export const SEGUNDOS_POR_FOTO = 7;
