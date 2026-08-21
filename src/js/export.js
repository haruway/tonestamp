/**
 * export.js — saída: PNG, SVG vetorial e gravação WebM.
 *
 * O export de SVG não é um traçado do canvas: ele reconstrói a composição
 * célula por célula usando as shapes originais, um `<g>` por combinação de
 * shape e cor, e um `<use>` por célula. É por isso que abre editável no
 * Illustrator.
 */

import { S, slots, N, getPalette } from './state.js';
import { parseSvg } from './shapes.js';
import { cellColor } from './palette.js';
import { tonemap, getFrame, paint } from './renderer.js';

/** @type {HTMLCanvasElement|null} */
let out = null;

/** @param {HTMLCanvasElement} canvas */
export function init(canvas) {
  out = canvas;
}

/** Nome de arquivo com timestamp, pra não sobrescrever download anterior. */
function filename(ext) {
  return 'tonestamp-' + Date.now() + '.' + ext;
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

/**
 * Baixa o quadro atual do canvas como PNG.
 *
 * Com `S.alpha` ligado, repinta o quadro sem o fundo logo antes de ler os
 * pixels. `toDataURL` é síncrono, então nada desenha entre uma coisa e outra;
 * o próximo quadro do loop já devolve o fundo à prévia.
 */
export function exportPNG() {
  if (!out) return;
  if (S.alpha) paint(performance.now(), { transparent: true });
  const data = out.toDataURL('image/png');
  if (S.alpha) paint(performance.now());
  download(data, filename('png'), false);
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
   * Devolve o id do `<g>` para (shape, cor), criando na primeira vez.
   * No modo Estado ou Quantizar isso gera pouquíssimos grupos. No modo
   * Pixel pode gerar centenas — está documentado no manual.
   *
   * Usa `<g>` e não `<symbol>` de propósito. O Illustrator lê SVG 1.1 e
   * trata `<symbol>` com viewBox de forma inconsistente; um `<g>` posicionado
   * por `transform` não depende de nenhum mapeamento de viewport.
   *
   * @returns {{id:string, vbW:number, vbH:number}|null}
   */
  function groupFor(i, hex) {
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

    // normaliza o viewBox pra origem, pra o transform do <use> ser só
    // posição e escala
    const [minX, minY, vbW, vbH] = pr.viewBox.trim().split(/[\s,]+/).map(Number);
    const inner =
      minX || minY
        ? `<g transform="translate(${-minX} ${-minY})">${clone.innerHTML}</g>`
        : clone.innerHTML;

    const entry = { id: 's' + symId.size, vbW: vbW || 100, vbH: vbH || 100 };
    symId.set(key, entry);
    defs.push(`<g id="${entry.id}">${inner}</g>`);
    return entry;
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
      const g0 = groupFor(idx, cellColor(S.cmode, slots[idx].color, rgb, ci, palette, S.sat));
      if (!g0) continue;

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
      const kx = (size / g0.vbW).toFixed(5);
      const ky = (size / g0.vbH).toFixed(5);

      // xlink:href primeiro, href depois: o Illustrator só entende o
      // primeiro (SVG 1.1), navegador moderno entende os dois. Era essa a
      // causa do arquivo abrir vazio no Illustrator e certo no Preview.
      body.push(
        `<use xlink:href="#${g0.id}" href="#${g0.id}" ` +
          `transform="translate(${px} ${py}) scale(${kx} ${ky})"/>`
      );
    }
  }

  const background = S.alpha ? '' : `<rect width="100%" height="100%" fill="${S.bg}"/>`;

  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `version="1.1" width="${out.width}" height="${out.height}" ` +
    `viewBox="0 0 ${out.width} ${out.height}">` +
    `<defs>${defs.join('')}</defs>` +
    background +
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
