/**
 * STOCK E ESTATÍSTICAS EM TEMPO REAL (Firestore) — POR FEIRA
 * -----------------------------------------------------------
 * Cada feira tem os seus próprios documentos (os stocks nunca se misturam):
 *   roletas/{FEIRA_ID}          → { premioId: unidades }
 *   roletas/{FEIRA_ID}--stats   → { entregues: n, origens: { es: 12, … } }
 *
 * - subscreverStock: escuta o stock ao vivo (todos os dispositivos em sincronia)
 * - reservarPremio: desconta 1 unidade DENTRO de uma transação — se dois
 *   dispositivos girarem ao mesmo tempo e só restar 1 unidade, só um ganha
 * - subscreverStats / registarEntrega / registarOrigem: contador público
 *   de prémios entregues e estatísticas de origem dos visitantes
 *
 * Sem Firebase configurado (lib/firebase.ts), tudo funciona em modo local.
 */

import {
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  increment,
} from "firebase/firestore";
import { db, firebaseAtivo } from "./firebase";
import { stockInicial } from "./premios";
import { FEIRA_ID } from "./config";

export type Stock = Record<string, number | null>;
export type Stats = {
  giros: number;      // interações totais no stand (a métrica do relatório)
  premios: number;    // giros que deram prémio
  derrotas: number;   // giros "sem sorte"
  entregues: number;  // prémios confirmados pelo staff
  origens: Record<string, number>;
};

export const STATS_VAZIAS: Stats = {
  giros: 0,
  premios: 0,
  derrotas: 0,
  entregues: 0,
  origens: {},
};

const DOC_STOCK = FEIRA_ID;
const DOC_STATS = FEIRA_ID + "--stats";

// ---- modo local (sem Firebase): dados em memória, só neste dispositivo ----
let stockLocal: Stock = stockInicial();
let statsLocal: Stats = { ...STATS_VAZIAS, origens: {} };
const ouvintesStock = new Set<(s: Stock) => void>();
const ouvintesStats = new Set<(s: Stats) => void>();

// forEach em vez de for...of: o tsconfig do template usa target "es5",
// que não permite iterar Sets diretamente (o build da Vercel falharia)
function emitirStockLocal() {
  ouvintesStock.forEach((cb) => cb({ ...stockLocal }));
}
function emitirStatsLocal() {
  ouvintesStats.forEach((cb) =>
    cb({ ...statsLocal, origens: { ...statsLocal.origens } })
  );
}

/* ============================== STOCK ============================== */

/** Escuta o stock em tempo real. Devolve função para cancelar. */
export function subscreverStock(cb: (s: Stock) => void): () => void {
  if (!firebaseAtivo || !db) {
    ouvintesStock.add(cb);
    cb({ ...stockLocal });
    return () => ouvintesStock.delete(cb);
  }

  const ref = doc(db, "roletas", DOC_STOCK);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        // primeiro arranque desta feira: semeia o documento
        setDoc(ref, stockInicial()).catch(() => {});
        cb(stockInicial());
      } else {
        cb(snap.data() as Stock);
      }
    },
    () => cb(stockInicial()) // erro de rede → mostra inicial, roleta continua
  );
}

/**
 * Tenta reservar 1 unidade do prémio ANTES da animação começar.
 * Devolve true se conseguiu. stock null/inexistente = ilimitado.
 */
export async function reservarPremio(id: string): Promise<boolean> {
  if (!firebaseAtivo || !db) {
    const atual = stockLocal[id];
    if (atual === null || atual === undefined) return true;
    if (atual <= 0) return false;
    stockLocal[id] = atual - 1;
    emitirStockLocal();
    return true;
  }

  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db!, "roletas", DOC_STOCK);
      const snap = await tx.get(ref);
      const dados = (snap.exists() ? snap.data() : stockInicial()) as Stock;
      const atual = dados[id];
      if (atual === null || atual === undefined) return; // ilimitado
      if (atual <= 0) throw new Error("esgotado");
      tx.set(ref, { ...dados, [id]: atual - 1 });
    });
    return true;
  } catch {
    return false;
  }
}

/** Repõe o stock inicial de lib/premios.ts (página /admin). */
export async function reporStock(): Promise<void> {
  if (!firebaseAtivo || !db) {
    stockLocal = stockInicial();
    emitirStockLocal();
    return;
  }
  await setDoc(doc(db, "roletas", DOC_STOCK), stockInicial());
}

/** Define manualmente o stock de todos os prémios (página /admin). */
export async function guardarStock(novo: Stock): Promise<void> {
  if (!firebaseAtivo || !db) {
    stockLocal = { ...novo };
    emitirStockLocal();
    return;
  }
  await setDoc(doc(db, "roletas", DOC_STOCK), novo);
}

/* =========================== ESTATÍSTICAS =========================== */

/** Escuta o contador de entregas + origens em tempo real. */
export function subscreverStats(cb: (s: Stats) => void): () => void {
  if (!firebaseAtivo || !db) {
    ouvintesStats.add(cb);
    cb({ ...statsLocal, origens: { ...statsLocal.origens } });
    return () => ouvintesStats.delete(cb);
  }

  const ref = doc(db, "roletas", DOC_STATS);
  return onSnapshot(
    ref,
    (snap) => {
      const dados = snap.exists() ? snap.data() : {};
      cb({
        giros: (dados.giros as number) || 0,
        premios: (dados.premios as number) || 0,
        derrotas: (dados.derrotas as number) || 0,
        entregues: (dados.entregues as number) || 0,
        origens: (dados.origens as Record<string, number>) || {},
      });
    },
    () => cb({ ...STATS_VAZIAS, origens: {} })
  );
}

/**
 * +1 giro (e prémio/derrota conforme o resultado).
 * Chamado no fim de cada giro — é ISTO que alimenta o relatório da feira:
 * "1.400 interações, 62% de taxa de prémio, 38% de espanhóis".
 */
export async function registarGiro(ganhou: boolean): Promise<void> {
  if (!firebaseAtivo || !db) {
    statsLocal.giros += 1;
    if (ganhou) statsLocal.premios += 1;
    else statsLocal.derrotas += 1;
    emitirStatsLocal();
    return;
  }
  const atualizacao: Record<string, unknown> = { giros: increment(1) };
  atualizacao[ganhou ? "premios" : "derrotas"] = increment(1);
  await setDoc(doc(db, "roletas", DOC_STATS), atualizacao, {
    merge: true,
  }).catch(() => {});
}

/** +1 prémio entregue (quando o staff toca em "Entregue"). */
export async function registarEntrega(): Promise<void> {
  if (!firebaseAtivo || !db) {
    statsLocal.entregues += 1;
    emitirStatsLocal();
    return;
  }
  await setDoc(
    doc(db, "roletas", DOC_STATS),
    { entregues: increment(1) },
    { merge: true }
  ).catch(() => {});
}

/** +1 visitante do país indicado (pergunta-relâmpago). */
export async function registarOrigem(codigo: string): Promise<void> {
  if (!firebaseAtivo || !db) {
    statsLocal.origens[codigo] = (statsLocal.origens[codigo] || 0) + 1;
    emitirStatsLocal();
    return;
  }
  const campo = "origens." + codigo;
  const atualizacao: Record<string, unknown> = {};
  atualizacao[campo] = increment(1);
  await setDoc(doc(db, "roletas", DOC_STATS), atualizacao, {
    merge: true,
  }).catch(() => {});
}

/** Repõe as estatísticas a zero (página /admin, nova feira). */
export async function reporStats(): Promise<void> {
  if (!firebaseAtivo || !db) {
    statsLocal = { ...STATS_VAZIAS, origens: {} };
    emitirStatsLocal();
    return;
  }
  await setDoc(doc(db, "roletas", DOC_STATS), {
    ...STATS_VAZIAS,
    origens: {},
  });
}
