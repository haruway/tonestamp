/**
 * export.js — saída: PNG, SVG vetorial e gravação WebM.
 *
 * O export de SVG não é um traçado do canvas: ele reconstrói a composição
 * célula por célula usando as shapes originais, uma `<symbol>` por combinação
 * de shape e cor e um `<use>` por célula. É por isso que abre editável no
 * Illustrator.
 */

import { S, slots, N, getPalette } from './state.js';
import { parseSvg } from './shapes.js';
import { cellColor } from './palette.js';
import { tonemap, getFrame } from './renderer.js';

/** @type {HTMLCanvasElement|null} */
let out = null;

/** @param {HTMLCanvasElement} canvas */
export function init(canvas) {
  out = canvas;
}

/** Nome de arquivo com timestamp, pra não sobrescrever download anterior. */
function filename(ext) {
  return 'svg-dither-' + Date.now() + '.' + ext;
}

/**
 * Dispara um download. Revoga object URL depois de um tempo — revogar na hora
 * cancela o download em alguns navegadores.
 * @param {string} href
 * @param {string} name
 * @param {boolean} isObjectUrl
 */
function download(href, name, isObjectUrl) {
  const a = document.createElement('a');
  a.download = name;
  a.href = href;
  a.click();
  if (isObjectUrl) setTimeout(() => URL.revokeObjectURL(href), 10000);
}

/* ---------------- PNG ---------------- */

/** Baixa o quadro atual do canvas como PNG. */
export function exportPNG() {
  if (!out) return;
  download(out.toDataURL('image/png'), filename('png'), false);
}

/* ---------------- SVG ---------------- */

/**
 * Reconstrói a composição em SVG vetorial e baixa.
 * @returns {string|null} mensagem de erro, ou null se deu certo
 */
export function exportSVG() {
  const frame = getFrame();
  if (!frame || !out) return 'nada pra exportar ainda';

  const { geo: g, cells, rgb } = frame;
  const cs = g.cs;

  // pré-parseia cada shape uma vez só
  const parsed = [];
  for (let i = 0; i < N; i++) {
    const slot = slots[i];
    if (!slot.on || !slot.svgText) {
      parsed.push(null);
      continue;
    }
    try {
      const { el, viewBox } = parseSvg(slot.svgText);
      parsed.push({ el, viewBox });
    } catch {
      parsed.push(null);
    }
  }

  const defs = [];
  const symId = new Map();

  /**
   * Devolve o id do `<symbol>` para (shape, cor), criando na primeira vez.
   * No modo Estado ou Quantizar isso gera pouquíssimos símbolos. No modo
   * Pixel pode gerar centenas — está documentado no manual.
   */
  function symbolFor(i, hex) {
    const key = i + '|' + hex;
    const hit = symId.get(key);
    if (hit) return hit;
    const pr = parsed[i];
    if (!pr) return null;
    const clone = pr.el.cloneNode(true);
    if (S.fill) {
      clone
        .querySelectorAll('path,circle,rect,polygon,ellipse,polyline,g')
        .forEach((n) => n.setAttribute('fill', hex));
    }
    const id = 's' + symId.size;
    symId.set(key, id);
    defs.push(`<symbol id="${id}" viewBox="${pr.viewBox}">${clone.innerHTML}</symbol>`);
    return id;
  }

  const palette = getPalette();
  const minF = S.minS / 100;
  const maxF = S.maxS / 100;
  const body = [];

  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const ci = y * g.cols + x;
      const l = tonemap(cells[ci]);
      let idx = Math.floor((1 - l) * N);
      if (idx >= N) idx = N - 1;
      if (idx < 0) idx = 0;
      if (S.invert) idx = N - 1 - idx;

      if (!parsed[idx]) continue;
      const id = symbolFor(idx, cellColor(S.cmode, slots[idx].color, rgb, ci, palette, S.sat));
      if (!id) continue;

      let size = cs;
      if (S.scale) {
        const band = 1 - ((1 - l) * N - Math.floor((1 - l) * N));
        size = cs * (minF + (maxF - minF) * (S.invert ? 1 - band : band));
      } else if (maxF !== 1) {
        size = cs * maxF;
      }
      if (size <= 0.2) continue;

      const px = (x * cs + cs / 2 - size / 2).toFixed(2);
      const py = (y * cs + cs / 2 - size / 2).toFixed(2);
      body.push(
        `<use href="#${id}" x="${px}" y="${py}" width="${size.toFixed(2)}" height="${size.toFixed(2)}"/>`
      );
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${out.width}" height="${out.height}" ` +
    `viewBox="0 0 ${out.width} ${out.height}">` +
    `<defs>${defs.join('')}</defs>` +
    `<rect width="100%" height="100%" fill="${S.bg}"/>` +
    body.join('') +
    `</svg>`;

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  download(url, filename('svg'), true);
  return null;
}

/* ---------------- WebM ---------------- */

/** @type {MediaRecorder|null} */
let rec = null;
let chunks = [];

/** @returns {boolean} se está gravando agora */
export function isRecording() {
  return !!rec && rec.state === 'recording';
}

/**
 * Liga ou desliga a gravação do canvas.
 *
 * Safari não implementa MediaRecorder pra canvas.captureStream, então lá isso
 * simplesmente não existe — é limitação do navegador, não da ferramenta.
 *
 * @param {(state:'recording'|'stopped'|'unsupported', message?:string) => void} onState
 */
export function toggleRecording(onState) {
  if (isRecording()) {
    rec.stop();
    return;
  }
  if (!out) return;

  try {
    if (typeof MediaRecorder === 'undefined' || !out.captureStream) {
      onState('unsupported', 'WebM não suportado neste navegador');
      return;
    }
    const stream = out.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      download(url, filename('webm'), true);
      chunks = [];
      rec = null;
      onState('stopped');
    };
    rec.start();
    onState('recording');
  } catch (err) {
    rec = null;
    onState('unsupported', 'WebM não suportado neste navegador');
  }
}
