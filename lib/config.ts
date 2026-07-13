/**
 * CONFIGURAÇÃO CENTRAL - muda TUDO o que é específico de cada feira AQUI
 * ----------------------------------------------------------------------
 * Para preparar a app para uma nova feira, normalmente só precisas de:
 *   1. Mudar FEIRA_ID (cria um documento novo no Firestore - os stocks
 *      de feiras diferentes nunca se misturam)
 *   2. Ajustar os prémios/stock em lib/premios.ts
 *   3. (opcional) Apontar QR_URL para uma landing page da campanha
 */

/** Identificador da feira atual. Ex.: "fitur-2027", "wtm-2026", "btravel-2027".
 *  O stock vive no documento Firestore `roletas/{FEIRA_ID}` e as estatísticas
 *  em `roletas/{FEIRA_ID}--stats`. */
export const FEIRA_ID = "demo-2026";

/** Nome legível da feira (aparece na página /admin). */
export const FEIRA_NOME = "Feira de demonstração";

/** URL aberto pelo QR code no ecrã de resultado.
 *  ⚙️ Confirma/atualiza para o URL oficial ou para uma página por campanha
 *  (ex.: https://www.visitbraga.travel/fitur). */
export const QR_URL = "https://www.visitbraga.travel";

/** PIN da página /admin. (Trava curiosos; não é segurança a sério.) */
export const ADMIN_PIN = "braga2026";

/** Pergunta-relâmpago "De onde nos visitas?" antes de cada giro.
 *  Põe false para desativar por completo (o botão passa a girar logo). */
export const PERGUNTA_ORIGEM = true;

/** Segundos de inatividade até entrar em modo montra (attract mode). */
export const SEGUNDOS_MONTRA = 45;

/**
 * IDIOMA POR OMISSÃO DESTA FEIRA - importante!
 * -------------------------------------------
 * O tablet do stand é do Município (browser em português), por isso a
 * deteção automática do idioma daria PT... em Madrid. Define aqui o
 * idioma DA FEIRA: "es" na Fitur, "en" na WTM, "pt" cá dentro.
 *
 * É o idioma inicial E o idioma para onde a app REGRESSA sozinha quando
 * entra em modo montra - o visitante seguinte nunca apanha o ecrã na
 * língua que o anterior escolheu.
 *
 * Põe null para voltar a detetar pelo browser (só faz sentido se a app
 * for aberta no telemóvel dos visitantes).
 */
export const IDIOMA_POR_OMISSAO: "pt" | "es" | "en" | null = "es";

/** Regra da casa, mostrada em letra pequena sob o botão GIRAR.
 *  Poupa ao staff repetir a mesma frase 400 vezes por dia. */
export const MOSTRAR_REGRA = true;

/** Opções da pergunta de origem (bandeiras de 1 toque).
 *  O código é a chave guardada nas estatísticas do Firestore. */
export const ORIGENS: { codigo: string; bandeira: string; nome: string }[] = [
  { codigo: "es", bandeira: "🇪🇸", nome: "España" },
  { codigo: "pt", bandeira: "🇵🇹", nome: "Portugal" },
  { codigo: "fr", bandeira: "🇫🇷", nome: "France" },
  { codigo: "uk", bandeira: "🇬🇧", nome: "United Kingdom" },
  { codigo: "de", bandeira: "🇩🇪", nome: "Deutschland" },
  { codigo: "it", bandeira: "🇮🇹", nome: "Italia" },
  { codigo: "nl", bandeira: "🇳🇱", nome: "Nederland" },
  { codigo: "outro", bandeira: "🌍", nome: "-" }, // nome traduzido em i18n.ts
];
