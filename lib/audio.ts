"use client";

/**
 * ÁUDIO - camada de som com botão de silêncio persistente
 * ---------------------------------------------------------
 * Sons sintetizados (Web Audio), não ficheiros: um sino real tem parciais
 * INARMÓNICOS (o 2.76× da badalada) e decaimento exponencial. É isso que
 * separa "sino de igreja" de "bip de micro-ondas". Zero pedidos de rede,
 * zero peso no bundle - funciona com o wi-fi desligado.
 *
 * (Howler serviria para tocar ficheiros; aqui não há ficheiros para tocar,
 * e sintetizar dá-nos o tique de altura variável que a física pede.)
 *
 * O silêncio é PERSISTENTE: num stand, se a equipa desligar o som, tem de
 * ficar desligado depois de recarregar a página.
 */

const CHAVE = "roleta-braga:som";

let ctx: AudioContext | null = null;
let silencio = false;
const ouvintes = new Set<(s: boolean) => void>();

export function iniciarAudio() {
  if (typeof window === "undefined") return;
  try {
    silencio = window.localStorage.getItem(CHAVE) === "off";
  } catch {
    /* modo privado: segue com som */
  }
  contexto();
}

export function estaSilenciado() {
  return silencio;
}

export function alternarSom(): boolean {
  silencio = !silencio;
  try {
    window.localStorage.setItem(CHAVE, silencio ? "off" : "on");
  } catch {}
  ouvintes.forEach((cb) => cb(silencio));
  if (!silencio) contexto();
  return silencio;
}

export function ouvirSom(cb: (s: boolean) => void): () => void {
  ouvintes.add(cb);
  // as chavetas são essenciais: `ouvintes.delete()` devolve um boolean, e a
  // função de limpeza do useEffect tem de devolver void
  return () => {
    ouvintes.delete(cb);
  };
}

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** corpo de sino: fundamental + parciais inarmónicos + decaimento */
function sino(freq: number, dur: number, vol: number, atraso = 0) {
  if (silencio) return;
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + atraso;
  const parciais: [number, number][] = [
    [1, 1],
    [2.76, 0.42], // o parcial da badalada
    [5.4, 0.15],
  ];
  parciais.forEach(([mult, peso]) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol * peso, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  });
}

/** progresso 0→1 do giro: a altura SOBE à medida que a roda cansa */
export function tique(progresso: number) {
  sino(740 + progresso * 280, 0.12, 0.032);
}

/** a roda assenta: grave, curto, seco */
export function pouso() {
  sino(196, 0.5, 0.055);
}

/** vitória: carrilhão ascendente */
export function repique() {
  [659, 784, 988, 1319].forEach((f, i) => sino(f, 0.85, 0.05, i * 0.11));
}

/** derrota: duas notas a descer, sem drama */
export function consolo() {
  sino(392, 0.45, 0.035);
  sino(294, 0.65, 0.03, 0.13);
}

/** vibração (Vibration API): o toque físico que fecha o ciclo */
export function vibrar(padrao: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(padrao);
    }
  } catch {}
}
