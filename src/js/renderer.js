/**
 * renderer.js — o núcleo: amostragem, mapeamento tonal e desenho.
 *
 * O algoritmo, em uma frase: reduz a fonte a um grid de cols×rows pixels,
 * lê a luminância de cada um, escolhe a faixa tonal correspondente e carimba
 * a shape daquela faixa na célula.
 *
 * Regra do módulo: nada de DOM além do canvas recebido em `init()`. Quem
 * quiser mostrar fps na tela se inscreve em `onStats`.
 */

import { S, slots, N, getPalette } from './state.js';
import { getTint } from './shapes.js';
import { cellColor } from './palette.js';
import { getSource } from './sources.js';

/** @type {HTMLCanvasElement|null} */
let out = null;
/** @type {CanvasRenderingContext2D|null} */
let ctx = null;

/** Canvas auxiliar onde a fonte é reduzida ao tamanho do grid. */
const samp = document.createElement('canvas');
const sctx = samp.getContext('2d', { willReadFrequently: true });

/* último quadro amostrado, reaproveitado quando o vídeo está pausado
   e usado pelo export pra não depender de um quadro novo */
let lastCells = null;
let lastRGB = null;
let lastGeo = null;

let rafId = 0;
let frames = 0;
let fpsT = 0;

const statsListeners = new Set();

/** @param {(stats:{fps:number, cols:number, rows:number}) => void} fn */
export function onStats(fn) {
  statsListeners.add(fn);
  return () => statsListeners.delete(fn);
}

/**
 * @param {HTMLCanvasElement} canvas canvas de saída
 */
export function init(canvas) {
  out = canvas;
  ctx = canvas.getContext('2d');
}

/**
 * Último quadro amostrado, pro export.
 * @returns {{geo:object, cells:Float32Array, rgb:Uint8ClampedArray}|null}
 */
export function getFrame() {
  if (!lastGeo || !lastCells) return null;
  return { geo: lastGeo, cells: lastCells, rgb: lastRGB };
}

/* ---------------- mapeamento tonal ---------------- */

/**
 * Aplica brilho, contraste e gamma antes da classificação.
 *
 * Isto roda ANTES do mapeamento, então não é efeito visual: é o que decide
 * em qual das 7 faixas a célula cai.
 *
 * @param {number} l luminância 0..1
 * @returns {number} 0..1
 */
export function tonemap(l) {
  let v = l + S.bri / 200;
  const c = S.con / 100;
  v = (v - 0.5) * (1 + c) + 0.5;
  v = Math.pow(Math.max(0, Math.min(1, v)), 1 / S.gam);
  return Math.max(0, Math.min(1, v));
}

/**
 * Geometria do quadro: recorte da fonte, tamanho do grid e do canvas.
 *
 * O número de linhas é derivado da proporção da fonte, nunca escolhido pelo
 * usuário — é o que mantém a célula quadrada.
 *
 * @param {number} srcW
 * @param {number} srcH
 */
export function geometry(srcW, srcH) {
  let w = srcW;
  let h = srcH;
  let ox = 0;
  let oy = 0;
  if (S.square) {
    const m = Math.min(w, h);
    ox = (w - m) / 2;
    oy = (h - m) / 2;
    w = h = m;
  }
  const cols = S.cols;
  const cell = w / cols;
  const rows = Math.max(1, Math.round(h / cell));
  const outW = S.res;
  const outH = Math.round((outW * rows) / cols);
  return { sx: ox, sy: oy, sw: w, sh: h, cols, rows, outW, outH, cs: outW / cols };
}

/**
 * Tamanho que a saída vai ter, mesmo antes do primeiro quadro ser desenhado.
 *
 * A interface precisa disto pra dizer o que a gravação vai produzir antes de
 * alguém clicar em gravar. Ler `out.width` direto não serve: no boot o canvas
 * ainda está no tamanho declarado no HTML, e a nota anunciava a taxa de bits
 * daquele tamanho até alguém encostar no slider de resolução.
 *
 * Sem fonte carregada não há proporção pra derivar, e aí o canvas atual é a
 * resposta certa — é ele que a gravação vai capturar.
 *
 * @returns {{w:number, h:number}}
 */
export function outputSize() {
  const info = getSource();
  if (!info || !info.w || !info.h) {
    return { w: out ? out.width : S.res, h: out ? out.height : S.res };
  }
  const g = geometry(info.w, info.h);
  return { w: g.outW, h: g.outH };
}

/**
 * Índice da faixa tonal de uma luminância já tonemapeada.
 * @param {number} l 0..1
 * @returns {number} 0..N-1
 */
function bandIndex(l) {
  let idx = Math.floor((1 - l) * N);
  if (idx >= N) idx = N - 1;
  if (idx < 0) idx = 0;
  return S.invert ? N - 1 - idx : idx;
}

/**
 * Fator de tamanho da célula, considerando scale e max size.
 * @param {number} l luminância tonemapeada
 * @returns {number} multiplicador do lado da célula
 */
function sizeFactor(l) {
  const minF = S.minS / 100;
  const maxF = S.maxS / 100;
  if (S.scale) {
    // posição dentro da faixa: mais claro = maior
    const band = 1 - ((1 - l) * N - Math.floor((1 - l) * N));
    return minF + (maxF - minF) * (S.invert ? 1 - band : band);
  }
  return maxF;
}

/* ---------------- amostragem e desenho ---------------- */

/** Reduz a fonte ao grid e calcula a luminância de cada célula. */
function sample() {
  const info = getSource();
  if (!info || !info.w || !info.h) return false;

  const g = geometry(info.w, info.h);
  if (out.width !== g.outW || out.height !== g.outH) {
    out.width = g.outW;
    out.height = g.outH;
  }

  samp.width = g.cols;
  samp.height = g.rows;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  try {
    sctx.drawImage(info.el, g.sx, g.sy, g.sw, g.sh, 0, 0, g.cols, g.rows);
  } catch {
    return false; // quadro ainda não disponível
  }

  let d;
  try {
    d = sctx.getImageData(0, 0, g.cols, g.rows).data;
  } catch {
    return false;
  }

  const cells = new Float32Array(g.cols * g.rows);
  for (let i = 0, p = 0; i < cells.length; i++, p += 4) {
    cells[i] = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
  }

  lastCells = cells;
  lastRGB = d;
  lastGeo = g;
  return true;
}

/**
 * Carimba as shapes no canvas de saída.
 *
 * @param {number} now timestamp do rAF, usado pela rotação
 * @param {{transparent?: boolean}} [opts] `transparent` limpa o canvas em vez
 *   de pintar o fundo. Usado só na hora de exportar PNG com alpha — o loop
 *   normal continua pintando o fundo, senão a prévia ficaria com o xadrez do
 *   navegador aparecendo por baixo.
 */
export function paint(now, opts) {
  const g = lastGeo;
  const cells = lastCells;
  if (!g || !cells || !ctx) return;

  if (opts && opts.transparent) {
    ctx.clearRect(0, 0, out.width, out.height);
  } else {
    ctx.fillStyle = S.bg;
    ctx.fillRect(0, 0, out.width, out.height);
  }

  const cs = g.cs;
  const step = S.rot ? Math.floor(now / S.rotInt) : 0;
  const palette = getPalette();
  const mode = S.cmode;
  const sat = S.sat;
  const fill = S.fill;

  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const ci = y * g.cols + x;
      const l = tonemap(cells[ci]);
      const idx = bandIndex(l);

      const slot = slots[idx];
      if (!slot.on) continue;

      const color = cellColor(mode, slot.color, lastRGB, ci, palette, sat);
      const tint = getTint(idx, slot.img, color, fill);
      if (!tint) continue;

      const size = cs * sizeFactor(l);
      if (size <= 0.2) continue;

      const cx = x * cs + cs / 2;
      const cy = y * cs + cs / 2;

      if (S.rot) {
        // sorteio estável por posição: a mesma célula gira sempre igual,
        // senão a textura ferve entre quadros
        const seed = ((x * 73856093) ^ (y * 19349663) ^ (idx * 83492791)) >>> 0;
        const q = ((seed >>> 3) + step + (seed % 4)) % 4;
        if (q) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((q * Math.PI) / 2);
          ctx.drawImage(tint, -size / 2, -size / 2, size, size);
          ctx.restore();
          continue;
        }
      }

      ctx.drawImage(tint, cx - size / 2, cy - size / 2, size, size);
    }
  }
}

/* ---------------- loop ---------------- */

function frame(now) {
  rafId = requestAnimationFrame(frame);

  const info = getSource();
  if (!info) return;

  // vídeo pausado: repinta o mesmo quadro, sem reamostrar.
  // Repintar ainda é necessário porque cor, escala e rotação mudam sem a fonte mudar.
  if (info.type !== 'image' && !S.playing && lastCells) {
    paint(now);
    return;
  }

  if (!sample()) return;
  paint(now);

  frames++;
  if (now - fpsT > 1000) {
    const g = lastGeo;
    for (const fn of statsListeners) fn({ fps: frames, cols: g.cols, rows: g.rows });
    frames = 0;
    fpsT = now;
  }
}

/** Liga o loop de render. Idempotente. */
export function start() {
  if (rafId) return;
  fpsT = performance.now();
  frames = 0;
  rafId = requestAnimationFrame(frame);
}

/**
 * Para o loop. Usado quando a aba fica oculta — sem isso o navegador
 * continua cobrando CPU de um canvas que ninguém está vendo.
 */
export function stop() {
  if (!rafId) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
}

/** @returns {boolean} se o loop está rodando */
export function isRunning() {
  return rafId !== 0;
}
