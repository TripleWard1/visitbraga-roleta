"use client";

/**
 * PÁGINA DE GESTÃO - /admin
 * -------------------------
 * Duas audiências, um ecrã:
 *
 * 1. EQUIPA DO STAND (durante a feira): stock ao vivo, reposição rápida,
 *    e um indicador honesto de LIGAÇÃO - porque a pior coisa que pode
 *    acontecer num stand é o staff julgar que o stock está a sincronizar
 *    entre tablets quando na verdade caiu para modo local.
 *
 * 2. DIVISÃO (depois da feira): os KPIs que justificam o investimento -
 *    interações totais, taxa de prémio, taxa de entrega e mercados de
 *    origem - com um botão "Copiar relatório" que devolve o texto pronto
 *    a colar num email ou numa nota interna.
 *
 * Protegida por PIN simples (lib/config.ts). Trava curiosos; para os dias
 * de feira chega. Se a app ficar online em permanência, usar Firebase Auth.
 */

import { useEffect, useState } from "react";
import { PREMIOS } from "@/lib/premios";
import {
  subscreverStock,
  guardarStock,
  reporStock,
  subscreverStats,
  reporStats,
  STATS_VAZIAS,
  type Stock,
  type Stats,
} from "@/lib/stock";
import { firebaseAtivo } from "@/lib/firebase";
import { ADMIN_PIN, FEIRA_ID, FEIRA_NOME, ORIGENS } from "@/lib/config";

/** stock baixo = alerta visual para a equipa repor a tempo */
const LIMIAR_BAIXO = 5;

export default function AdminPage() {
  const [autorizado, setAutorizado] = useState(false);
  const [pin, setPin] = useState("");
  const [stock, setStock] = useState<Stock>({});
  const [stats, setStats] = useState<Stats>(STATS_VAZIAS);
  const [edicao, setEdicao] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  useEffect(() => {
    if (!autorizado) return;
    const a = subscreverStock(setStock);
    const b = subscreverStats(setStats);
    return () => {
      a();
      b();
    };
  }, [autorizado]);

  const avisar = (texto: string) => {
    setMsg(texto);
    setTimeout(() => setMsg(""), 2500);
  };

  if (!autorizado) {
    return (
      <main className="admin">
        <h1>Gestão do stand</h1>
        <p className="admin-nota">Roda da Sorte · Visit Braga · Feiras</p>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && pin === ADMIN_PIN && setAutorizado(true)
          }
        />
        <button onClick={() => pin === ADMIN_PIN && setAutorizado(true)}>
          Entrar
        </button>
      </main>
    );
  }

  const premiosComStock = PREMIOS.filter((p) => p.stock !== null);
  const totalRestante = premiosComStock.reduce(
    (s, p) => s + (Number(stock[p.id]) || 0),
    0
  );

  // KPIs da feira
  const taxaPremio = stats.giros
    ? Math.round((stats.premios / stats.giros) * 100)
    : 0;
  const taxaEntrega = stats.premios
    ? Math.round((stats.entregues / stats.premios) * 100)
    : 0;
  const totalOrigens = Object.keys(stats.origens).reduce(
    (s, k) => s + (stats.origens[k] || 0),
    0
  );

  const origensOrdenadas = ORIGENS.map((o) => ({
    ...o,
    n: stats.origens[o.codigo] || 0,
    pct: totalOrigens
      ? Math.round(((stats.origens[o.codigo] || 0) / totalOrigens) * 100)
      : 0,
  })).sort((a, b) => b.n - a.n);

  const guardar = async () => {
    const novo: Stock = { ...stock };
    for (const par of Object.entries(edicao)) {
      const n = parseInt(String(par[1]), 10);
      if (!Number.isNaN(n) && n >= 0) novo[par[0]] = n;
    }
    await guardarStock(novo);
    setEdicao({});
    avisar("Stock guardado ✔");
  };

  const repor = async () => {
    if (!confirm("Repor o stock inicial de lib/premios.ts nesta feira?")) return;
    await reporStock();
    setEdicao({});
    avisar("Stock inicial reposto ✔");
  };

  const zerarStats = async () => {
    if (!confirm("Pôr todas as estatísticas desta feira a zero?")) return;
    await reporStats();
    avisar("Estatísticas a zero ✔");
  };

  /** texto pronto a colar num email institucional ou nota interna */
  const copiarRelatorio = async () => {
    const linhas = [
      `RELATÓRIO - Roda da Sorte Visit Braga`,
      `Feira: ${FEIRA_NOME} (${FEIRA_ID})`,
      `Data de extração: ${new Date().toLocaleDateString("pt-PT")}`,
      ``,
      `INTERAÇÃO`,
      `• Giros (interações no stand): ${stats.giros}`,
      `• Prémios atribuídos: ${stats.premios} (${taxaPremio}% dos giros)`,
      `• Prémios entregues em mão: ${stats.entregues} (${taxaEntrega}% dos atribuídos)`,
      `• Giros sem prémio: ${stats.derrotas}`,
      ``,
      `MERCADOS DE ORIGEM (${totalOrigens} respostas)`,
      ...origensOrdenadas
        .filter((o) => o.n > 0)
        .map(
          (o) =>
            `• ${o.codigo === "outro" ? "Outro" : o.nome}: ${o.n} (${o.pct}%)`
        ),
      ``,
      `STOCK`,
      ...premiosComStock.map(
        (p) =>
          `• ${p.linha1.pt}${p.linha2 ? " " + p.linha2.pt : ""}: ${
            stock[p.id] ?? 0
          } por entregar`
      ),
    ];
    const texto = linhas.join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Relatório copiado ✔");
    } catch {
      // fallback para browsers sem permissão de área de transferência
      window.prompt("Copia o relatório:", texto);
    }
  };

  return (
    <main className="admin">
      <h1>Gestão do stand</h1>
      <p className="admin-nota">
        Feira ligada: <strong>{FEIRA_NOME}</strong> - documento Firestore{" "}
        <code>roletas/{FEIRA_ID}</code>
      </p>

      {/* estado da ligação: o staff tem de saber SEMPRE se está sincronizado */}
      <div
        className={
          "admin-estado " +
          (!firebaseAtivo
            ? "estado-local"
            : online
            ? "estado-ok"
            : "estado-offline")
        }
      >
        {!firebaseAtivo
          ? "⚠ MODO LOCAL - Firebase por configurar (lib/firebase.ts). O stock vive só neste dispositivo."
          : online
          ? "✓ Sincronizado - o stock é partilhado em tempo real entre todos os tablets."
          : "⚠ SEM REDE - a app continua a funcionar, mas este tablet só voltará a sincronizar quando houver ligação."}
      </div>

      <h2>Resultados da feira</h2>
      <div className="kpis">
        <div className="kpi">
          <span className="kpi-num">{stats.giros}</span>
          <span className="kpi-rot">Interações</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{stats.premios}</span>
          <span className="kpi-rot">Prémios ({taxaPremio}%)</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{stats.entregues}</span>
          <span className="kpi-rot">Entregues ({taxaEntrega}%)</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{totalRestante}</span>
          <span className="kpi-rot">Por entregar</span>
        </div>
      </div>
      <div className="admin-acoes">
        <button onClick={copiarRelatorio}>Copiar relatório</button>
      </div>

      <h2>Mercados de origem</h2>
      {totalOrigens === 0 ? (
        <p className="admin-nota">Ainda sem respostas.</p>
      ) : (
        <table className="admin-tabela">
          <tbody>
            {origensOrdenadas.map((o) => (
              <tr key={o.codigo}>
                <td style={{ width: 150 }}>
                  {o.bandeira} {o.codigo === "outro" ? "Outro" : o.nome}
                </td>
                <td>
                  <div className="barra">
                    <div
                      className="barra-cheia"
                      style={{ width: Math.max(o.pct, o.n ? 3 : 0) + "%" }}
                    />
                  </div>
                </td>
                <td className="admin-restam" style={{ width: 78 }}>
                  {o.n} · {o.pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Stock ao vivo</h2>
      <table className="admin-tabela">
        <thead>
          <tr>
            <th>Prémio</th>
            <th>Restam</th>
            <th>Novo valor</th>
          </tr>
        </thead>
        <tbody>
          {premiosComStock.map((p) => {
            const restam = Number(stock[p.id] ?? 0);
            const baixo = restam <= LIMIAR_BAIXO;
            return (
              <tr key={p.id}>
                <td>
                  {p.destaque ? "★ " : ""}
                  {p.linha1.pt}
                  {p.linha2 ? " " + p.linha2.pt : ""}
                </td>
                <td className={"admin-restam" + (baixo ? " restam-baixo" : "")}>
                  {stock[p.id] ?? "-"}
                  {baixo ? (restam === 0 ? " · esgotado" : " · baixo") : ""}
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    placeholder={String(stock[p.id] ?? 0)}
                    value={edicao[p.id] ?? ""}
                    onChange={(e) =>
                      setEdicao({ ...edicao, [p.id]: e.target.value })
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="admin-acoes">
        <button onClick={guardar}>Guardar alterações</button>
        <button className="admin-perigo" onClick={repor}>
          Repor stock inicial
        </button>
        <button className="admin-perigo" onClick={zerarStats}>
          Zerar estatísticas
        </button>
      </div>

      {msg ? <p className="admin-msg">{msg}</p> : null}
    </main>
  );
}
