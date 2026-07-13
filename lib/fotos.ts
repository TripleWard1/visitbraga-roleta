/**
 * FOTOGRAFIA DO DESTINO - servida de /public (sem terceiros)
 * As três fotos oficiais já estão em /public/fotos/ (1600×900, JPG
 * progressivo q80). A app mostra-as com o wi-fi DESLIGADO.
 * -----------------------------------------------------------
 * Antes vinham do imgur: serviço de terceiros, sem licença oficial e sem
 * garantias - e, pior, sem rede não carregavam. A app tem de arrancar,
 * girar e mostrar fotos com o wi-fi DESLIGADO.
 *
 * FICHEIROS A COLOCAR EM /public/fotos/ (do banco oficial do Município):
 *   bom-jesus.jpg          1600×900, JPG progressivo, qualidade 80, ≤500 KB
 *   museu-arqueologia.jpg  1600×900, idem
 *   se-de-braga.jpg        1600×900, idem
 *
 * Recorte 16:9, sem pessoas em primeiro plano, sem céus queimados (o
 * duotone come o detalhe nas zonas claras). Se faltar alguma, a app salta-a
 * e volta à versão gráfica - nunca mostra imagem partida.
 */

export const FOTOS_ATIVAS = true;

export type Foto = {
  ficheiro: string; // URL (ou caminho em /public)
  local: { pt: string; es: string; en: string }; // legenda que VENDE
};

export const FOTOS: Foto[] = [
  {
    ficheiro: "/fotos/bom-jesus.jpg",
    local: {
      pt: "Bom Jesus do Monte · Património Mundial UNESCO",
      es: "Bom Jesus do Monte · Patrimonio Mundial UNESCO",
      en: "Bom Jesus do Monte · UNESCO World Heritage",
    },
  },
  {
    ficheiro: "/fotos/museu-arqueologia.jpg",
    local: {
      pt: "Museu D. Diogo de Sousa · Bracara Augusta",
      es: "Museo D. Diogo de Sousa · Bracara Augusta",
      en: "D. Diogo de Sousa Museum · Bracara Augusta",
    },
  },
  {
    ficheiro: "/fotos/se-de-braga.jpg",
    local: {
      pt: "Sé de Braga · A catedral mais antiga do país",
      es: "Catedral de Braga · La más antigua del país",
      en: "Braga Cathedral · The country's oldest",
    },
  },
];

/** segundos que cada fotografia fica no ecrã */
export const SEGUNDOS_POR_FOTO = 7;
