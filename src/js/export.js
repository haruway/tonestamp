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

/* ---------------- gravação de vídeo ---------------- */

/** @type {MediaRecorder|null} */
let rec = null;
let chunks = [];

/** Quadros por segundo da captura. */
const REC_FPS = 30;

/**
 * Formatos tentados em ordem de preferência.
 *
 * MP4 primeiro porque é o que abre em qualquer lugar sem conversor — Premiere,
 * DaVinci, Instagram, WhatsApp. O Chrome expõe H.264 no MediaRecorder desde a
 * 126 e o Safari também, então na prática a maioria das pessoas recebe MP4.
 * WebM fica de reserva pra quem não tiver H.264 disponível.
 */
const REC_FORMATS = [
  { mime: 'video/mp4;codecs=avc1.640028', ext: 'mp4' },
  { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
  { mime: 'video/mp4', ext: 'mp4' },
  { mime: 'video/webm;codecs=vp9', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
];

/** @returns {{mime:string, ext:string}|null} primeiro formato suportado */
function pickFormat() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const f of REC_FORMATS) {
    if (MediaRecorder.isTypeSupported(f.mime)) return f;
  }
  return null;
}

/**
 * Taxa de bits proporcional à área do canvas.
 *
 * O conteúdo aqui é de borda dura e cor chapada, que é justamente o que mais
 * sofre com compressão: bitrate baixo espalha sujeira em volta de cada shape.
 * 0,25 bit por pixel por quadro segura as bordas limpas; o teto de 40 Mb/s
 * evita arquivo absurdo em 3000px.
 *
 * @param {number} w
 * @param {number} h
 */
function bitrateFor(w, h) {
  const bits = w * h * REC_FPS * 0.25;
  return Math.round(Math.min(40e6, Math.max(10e6, bits)));
}

/** @returns {boolean} se está gravando agora */
export function isRecording() {
  return !!rec && rec.state === 'recording';
}

/**
 * Descreve o que a gravação vai produzir, pra mostrar na interface antes de
 * alguém clicar.
 * @param {number} w
 * @param {number} h
 * @returns {{ext:string, mbps:number, fps:number}|null}
 */
export function recordingInfo(w, h) {
  const fmt = pickFormat();
  if (!fmt || !out || !out.captureStream) return null;
  return { ext: fmt.ext, mbps: Math.round(bitrateFor(w, h) / 1e5) / 10, fps: REC_FPS };
}

/**
 * Liga ou desliga a gravação do canvas.
 *
 * Antes isto falhava calado: erro do MediaRecorder não era tratado, e se
 * nenhum dado chegasse ele ainda assim baixava um arquivo de zero byte. Quem
 * testava via "não funciona" sem nenhuma pista. Agora todo caminho de falha
 * chega na interface com motivo.
 *
 * @param {(state:'recording'|'stopped'|'error', detail?:{key:string, vars?:object}) => void} onState
 */
export function toggleRecording(onState) {
  if (isRecording()) {
    rec.stop();
    return;
  }
  if (!out) return;

  const fmt = pickFormat();
  if (!fmt || !out.captureStream) {
    onState('error', { key: 'err.rec.unsupported' });
    return;
  }

  try {
    const stream = out.captureStream(REC_FPS);
    if (!stream || !stream.getVideoTracks().length) {
      onState('error', { key: 'err.rec.noStream' });
      return;
    }

    rec = new MediaRecorder(stream, {
      mimeType: fmt.mime,
      videoBitsPerSecond: bitrateFor(out.width, out.height),
    });
    chunks = [];

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };

    rec.onerror = (e) => {
      const name = (e && e.error && e.error.name) || '?';
      rec = null;
      chunks = [];
      onState('error', { key: 'err.rec.failed', vars: { name } });
    };

    rec.onstop = () => {
      rec = null;
      if (!chunks.length) {
        // sem nenhum quadro: aconteceu ao gravar com a aba escondida, quando o
        // loop de render para e o canvas deixa de mudar
        onState('error', { key: 'err.rec.empty' });
        return;
      }
      const url = URL.createObjectURL(new Blob(chunks, { type: fmt.mime }));
      download(url, filename(fmt.ext), true);
      chunks = [];
      onState('stopped');
    };

    // timeslice: os dados chegam a cada segundo em vez de tudo no fim, então
    // uma interrupção não leva a gravação inteira junto
    rec.start(1000);
    onState('recording');
  } catch (err) {
    rec = null;
    onState('error', { key: 'err.rec.failed', vars: { name: (err && err.name) || '?' } });
  }
}
