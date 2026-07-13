"use client";

/**
 * CONFETES - motor próprio, com física, ZERO dependências
 * --------------------------------------------------------
 * Porquê não usar a biblioteca: o npm do ambiente rebentou (proxy do
 * WebContainer), e um stand de feira não pode depender de uma instalação
 * frágil por causa de confetes. São ~80 linhas. Fazemo-las nós.
 *
 * O que a torna física a sério, e não quadrados a cair a direito:
 *   - velocidade inicial + ângulo de disparo (rajadas laterais, dos cantos
 *     de baixo para o centro, como um canhão)
 *   - GRAVIDADE constante
 *   - ARRASTO do ar (as peças abrandam, não caem em linha reta)
 *   - rotação em dois eixos: cada peça roda e "vira de lado", o que faz a
 *     largura oscilar - é isto que dá a ilusão de papel a rodopiar
 *   - desvanecimento no fim de vida
 *
 * Corre num <canvas> por cima de tudo e limpa-se sozinho.
 * Respeita prefers-reduced-motion.
 */

type Peca = {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vrot: number;
  fase: number;      // ângulo do "virar de lado"
  vfase: number;
  larg: number; alt: number;
  cor: string;
  vida: number;      // 1 → 0
};

const CORES = ["#e00009", "#ffffff", "#1a1a1c", "#ff2415", "#c50007"];

const GRAVIDADE = 0.42;
const ARRASTO = 0.988;

export function dispararConfetes(quantidade = 150) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetes-canvas";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const L = window.innerWidth;
  const A = window.innerHeight;
  canvas.width = L * dpr;
  canvas.height = A * dpr;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const pecas: Peca[] = [];

  /** um canhão: dispara de (x,y) num ângulo, com dispersão */
  const canhao = (x: number, y: number, angulo: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = angulo + (Math.random() - 0.5) * 0.9;   // dispersão ~50°
      const v = 13 + Math.random() * 11;                 // velocidade inicial
      pecas.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: -Math.sin(a) * v,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        fase: Math.random() * Math.PI * 2,
        vfase: 0.14 + Math.random() * 0.16,
        larg: 7 + Math.random() * 6,
        alt: 10 + Math.random() * 7,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        vida: 1,
      });
    }
  };

  // duas rajadas laterais, dos cantos de baixo para o centro
  const metade = Math.floor(quantidade / 2);
  canhao(L * 0.04, A * 0.86, Math.PI / 3.2, metade);        // esquerda → cima/direita
  canhao(L * 0.96, A * 0.86, Math.PI - Math.PI / 3.2, metade); // direita → cima/esquerda

  // segunda salva, mais perto do centro (dá a sensação de "explosão dupla")
  setTimeout(() => {
    canhao(L * 0.2, A * 0.9, Math.PI / 2.6, 40);
    canhao(L * 0.8, A * 0.9, Math.PI - Math.PI / 2.6, 40);
  }, 240);

  let raf = 0;
  const passo = () => {
    ctx.clearRect(0, 0, L, A);
    let vivas = 0;

    for (const p of pecas) {
      if (p.vida <= 0) continue;

      p.vx *= ARRASTO;
      p.vy = p.vy * ARRASTO + GRAVIDADE;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.fase += p.vfase;

      // fora do ecrã por baixo → morre
      if (p.y > A + 40) { p.vida = 0; continue; }
      // começa a desvanecer na descida
      if (p.vy > 0) p.vida -= 0.006;

      vivas++;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // o "virar de lado": a largura oscila com a fase → papel a rodopiar
      ctx.scale(Math.cos(p.fase), 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.vida));
      ctx.fillStyle = p.cor;
      ctx.fillRect(-p.larg / 2, -p.alt / 2, p.larg, p.alt);
      ctx.restore();
    }

    if (vivas > 0) {
      raf = requestAnimationFrame(passo);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();   // limpa-se sozinho
    }
  };

  raf = requestAnimationFrame(passo);

  // rede de segurança: nunca deixar o canvas preso no ecrã
  setTimeout(() => {
    cancelAnimationFrame(raf);
    canvas.remove();
  }, 9000);
}
