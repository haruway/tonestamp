/**
 * shapes.js — tudo que envolve SVG: as shapes padrão, rasterização,
 * tingimento e o cache de tints.
 *
 * Não conhece o DOM da página. Cria canvas e Image em memória, e só.
 * Não importa nada de `state.js` — recebe por parâmetro o que precisa saber.
 * É isso que permite testar este módulo isolado.
 */

import { SHAPE_SETS } from './shape-sets.js';

/**
 * Resolução em que cada shape é rasterizada antes de ser desenhada na célula.
 * 128px cobre com folga o tamanho de célula usado na prática (o export vai até
 * 3000px de largura com no mínimo 8 colunas, mas células grandes assim são raras
 * e o custo de subir isso é memória multiplicada por cada entrada do cache).
 */
export const TINT_PX = 128;

/**
 * Conjunto padrão: rampa monotônica de área preenchida, do highlight cheio
 * até o ponto quase invisível da sombra.
 *
 * Vem de `shape-sets.js`, que é gerado a partir de `shapes/default/`. Antes
 * esta constante era escrita à mão em paralelo aos arquivos, e as duas cópias
 * dessincronizavam.
 */
export const DEFAULT_SVG = SHAPE_SETS[0].svgs;

/* ---------------- parsing ---------------- */

/**
 * Faz o parse de um SVG e devolve o elemento raiz e o viewBox resolvido.
 * Lança se o texto não for um SVG válido — o protótipo falhava em silêncio
 * aqui, e é o que gerava shape sumida sem explicação.
 *
 * A mensagem do erro é uma CHAVE de tradução, não uma frase: este módulo não
 * conhece idioma. Quem traduz é o main.js.
 *
 * @param {string} text código-fonte do SVG
 * @returns {{el: Element, viewBox: string}}
 */
export function parseSvg(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('err.svg.empty');
  }
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('err.svg.malformed');
  }
  const el = doc.documentElement;
  if (!el || el.nodeName.toLowerCase() !== 'svg') {
    throw new Error('err.svg.notSvg');
  }
  const viewBox =
    el.getAttribute('viewBox') ||
    `0 0 ${parseFloat(el.getAttribute('width')) || 100} ${parseFloat(el.getAttribute('height')) || 100}`;
  return { el, viewBox };
}

/**
 * Rasteriza um SVG numa Image de TINT_PX.
 *
 * Reescreve width/height explícitos antes de serializar porque Safari e
 * Firefox se recusam a desenhar SVG sem dimensão intrínseca num canvas.
 *
 * @param {string} text
 * @returns {Promise<HTMLImageElement>}
 */
export function svgToImage(text) {
  return new Promise((resolve, reject) => {
    let payload = text;
    try {
      const { el } = parseSvg(text);
      if (!el.getAttribute('viewBox')) {
        const w = parseFloat(el.getAttribute('width')) || 100;
        const h = parseFloat(el.getAttribute('height')) || 100;
        el.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      el.setAttribute('width', String(TINT_PX));
      el.setAttribute('height', String(TINT_PX));
      payload = new XMLSerializer().serializeToString(el);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('err.svg.malformed'));
      return;
    }

    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('err.svg.draw'));
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(payload);
  });
}

/**
 * Carrega a imagem de um slot, guardando o erro no próprio slot em vez de
 * estourar. Devolve a chave de erro, ou null se deu certo.
 *
 * @param {import('./state.js').Slot} slot
 * @returns {Promise<string|null>}
 */
export async function buildSlotImage(slot) {
  if (!slot.svgText) {
    slot.img = null;
    slot.error = null;
    slot.dirtyImg = false;
    return null;
  }
  if (slot.img && !slot.dirtyImg) return slot.error;

  // Guarda o texto que estamos carregando. Se o slot for trocado enquanto o
  // await está pendente — trocar de conjunto duas vezes rápido faz isso —
  // este resultado está obsoleto e não pode ser gravado: gravá-lo deixaria
  // `dirtyImg` falso com a imagem do conjunto ANTERIOR, e a reconstrução
  // seguinte pularia o slot achando que já estava em dia.
  const pending = slot.svgText;

  try {
    const img = await svgToImage(pending);
    if (slot.svgText !== pending) return slot.error; // obsoleto, descarta
    slot.img = img;
    slot.dirtyImg = false;
    slot.error = null;
    return null;
  } catch (err) {
    if (slot.svgText !== pending) return slot.error;
    slot.img = null;
    slot.dirtyImg = false;
    slot.error = err.message || 'err.svg.malformed';
    return slot.error;
  }
}

/* ---------------- tingimento ---------------- */

/**
 * Desenha a shape centralizada e, se `solid`, troca todos os pixels opacos
 * pela cor pedida via `source-in`.
 *
 * @param {HTMLImageElement} img
 * @param {string} color hex
 * @param {boolean} solid
 * @returns {HTMLCanvasElement}
 */
export function makeTint(img, color, solid) {
  const c = document.createElement('canvas');
  c.width = c.height = TINT_PX;
  const x = c.getContext('2d');
  const s = Math.min(TINT_PX / img.width, TINT_PX / img.height);
  const w = img.width * s;
  const h = img.height * s;
  x.drawImage(img, (TINT_PX - w) / 2, (TINT_PX - h) / 2, w, h);
  if (solid) {
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, TINT_PX, TINT_PX);
    x.globalCompositeOperation = 'source-over';
  }
  return c;
}

/**
 * Cache de shape tingida.
 *
 * O teto de 1200 entradas não é decoração: no modo Pixel cada célula pode
 * pedir uma cor diferente. As cores chegam aqui já quantizadas em passos de
 * 32 por canal (ver `palette.cellColor`), o que limita o espaço a 9³ = 729
 * cores por shape. O teto cobre o pior caso com folga e o cache é zerado
 * inteiro quando estoura — zerar é mais barato e mais previsível que LRU,
 * e o custo é um quadro mais lento de vez em quando.
 */
const tintCache = new Map();
const TINT_CACHE_MAX = 1200;

/** Zera o cache. Chame sempre que shape, cor de estado ou `fill` mudarem. */
export function clearTints() {
  tintCache.clear();
}

/** @returns {number} entradas em cache, pra depuração */
export function tintCacheSize() {
  return tintCache.size;
}

/**
 * Devolve a shape do slot já tingida, criando e guardando sob demanda.
 *
 * @param {number} slotIndex índice do slot, compõe a chave do cache
 * @param {HTMLImageElement|null} img imagem já rasterizada do slot
 * @param {string} hex cor pedida
 * @param {boolean} solid se falso, o SVG mantém as cores originais
 * @returns {HTMLCanvasElement|null}
 */
export function getTint(slotIndex, img, hex, solid) {
  if (!img) return null;
  const key = slotIndex + '|' + (solid ? hex : 'raw');
  let c = tintCache.get(key);
  if (c) return c;
  c = makeTint(img, hex, solid);
  if (tintCache.size > TINT_CACHE_MAX) tintCache.clear();
  tintCache.set(key, c);
  return c;
}
