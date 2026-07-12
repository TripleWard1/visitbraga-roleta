/**
 * MOTOR DE SOM - sinos sintetizados (zero ficheiros de áudio)
 * ------------------------------------------------------------
 * Um sino real não é uma onda pura: tem parciais INARMÓNICOS (o famoso
 * 2.76× do modo de badalada) e um decaimento exponencial. É isso que
 * distingue "sino de igreja" de "bip de micro-ondas".
 *
 * Quatro sons, todos derivados do mesmo corpo:
 *   tique(p)  - a passar cada fatia; a altura sobe com a desaceleração,
 *               o que dá a sensação física de a roda estar a "cansar"
 *   pouso()   - a roda assenta (baixo, curto, seco)
 *   repique() - vitória: carrilhão ascendente
 *   toque()   - derrota: duas notas descendentes, sem drama
 */

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new Ctor();
    }
    // iOS suspende o contexto até haver interação
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** corpo de sino: fundamental + parciais inarmónicos, decaimento exp. */
function sino(freq: number, dur: number, vol: number, atraso = 0) {
  const c = contexto();
  if (!c) return;
  const t0 = c.currentTime + atraso;
  const parciais: [number, number][] = [
    [1, 1],
    [2.76, 0.42], // parcial de badalada
    [5.4, 0.16],
  ];
  parciais.forEach(([mult, peso]) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol * peso, t0 + 0.004); // ataque seco
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  });
}

/** progresso 0→1 do giro: a altura sobe à medida que abranda */
export function tique(progresso: number) {
  sino(760 + progresso * 260, 0.13, 0.035);
}

export function pouso() {
  sino(196, 0.5, 0.06);
}

export function repique() {
  [659, 784, 988, 1319].forEach((f, i) => sino(f, 0.85, 0.055, i * 0.11));
}

export function toque() {
  sino(392, 0.5, 0.04);
  sino(294, 0.7, 0.035, 0.14);
}

/** desbloqueia o áudio no primeiro toque (política dos browsers) */
export function acordarAudio() {
  contexto();
}
