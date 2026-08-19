/**
 * shapes.js — tudo que envolve SVG: as shapes padrão, rasterização,
 * tingimento e o cache de tints.
 *
 * Não conhece o DOM da página. Cria canvas e Image em memória, e só.
 * Não importa nada de `state.js` — recebe por parâmetro o que precisa saber.
 * É isso que permite testar este módulo isolado.
 */

/**
 * Resolução em que cada shape é rasterizada antes de ser desenhada na célula.
 * 128px cobre com folga o tamanho de célula usado na prática (o export vai até
 * 3000px de largura com no mínimo 8 colunas, mas células grandes assim são raras
 * e o custo de subir isso é memória multiplicada por cada entrada do cache).
 */
export const TINT_PX = 128;

/**
 * Conjunto padrão: rampa monotônica de área preenchida, do highlight cheio
 * até o ponto quase invisível da sombra. Os mesmos arquivos estão em
 * `shapes/default/` — aqui eles ficam embutidos pra ferramenta funcionar
 * offline, sem fetch, com duplo clique.
 */
export const DEFAULT_SVG = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#fff"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fff"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="#fff"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 4 96 50 50 96 4 50Z" fill="#fff"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#fff" fill-rule="evenodd" d="M50 12a38 38 0 1 1 0 76 38 38 0 0 1 0-76Zm0 16a22 22 0 1 0 0 44 22 22 0 0 0 0-44Z"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="36" y="36" width="28" height="28" fill="#fff"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="7" fill="#fff"/></svg>`,
];

/* ---------------- parsing ---------------- */

/**
 * Faz o parse de um SVG e devolve o elemento raiz e o viewBox resolvido.
 * Lança se o texto não for um SVG válido — o protótipo falhava em silêncio
 * aqui, e é o que gerava shape sumida sem explicação.
 *
 * @param {string} text código-fonte do SVG
 * @returns {{el: Element, viewBox: string}}
 */
export function parseSvg(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('arquivo vazio');
  }
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('XML malformado');
  }
  const el = doc.documentElement;
  if (!el || el.nodeName.toLowerCase() !== 'svg') {
    throw new Error('a raiz do arquivo não é <svg>');
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
      reject(err instanceof Error ? err : new Error('SVG inválido'));
      return;
    }

    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('o navegador não conseguiu desenhar este SVG'));
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(payload);
  });
}

/**
 * Carrega a imagem de um slot, guardando o erro no próprio slot em vez de
 * estourar. Devolve a mensagem de erro, ou null se deu certo.
 *
 * @param {import('./state.js').Slot} slot
 * @returns {Promise<string|null>}
 */
export async function buildSlotImage(slot) {
  if (!slot.svgText) {
    slot.img = null;
    slot.error = null;
    return null;
  }
  if (slot.img && !slot.dirtyImg) return slot.error;
  try {
    slot.img = await svgToImage(slot.svgText);
    slot.dirtyImg = false;
    slot.error = null;
    return null;
  } catch (err) {
    slot.img = null;
    slot.dirtyImg = false;
    slot.error = err.message || 'SVG inválido';
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
