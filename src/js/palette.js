/**
 * palette.js — cor: conversões, luminância, saturação, extração de paleta
 * por k-means e a decisão de cor de cada célula.
 *
 * Não conhece o DOM da página. `extractPalette` cria um canvas em memória
 * só pra reamostrar a fonte.
 */

/** Luminância relativa aproximada (coeficientes Rec.709), em 0..255. */
export function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {string} h cor no formato `#rrggbb`
 * @returns {[number,number,number]}
 */
export function hex2rgb(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

/**
 * @returns {string} cor no formato `#rrggbb`, com clamp e arredondamento
 */
export function rgb2hex(r, g, b) {
  const f = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}

/**
 * Afasta ou aproxima a cor da própria luminância.
 * @param {number} amt -100 a 100
 * @returns {[number,number,number]} pode sair fora de 0..255, o clamp é no hex
 */
export function saturate(r, g, b, amt) {
  if (!amt) return [r, g, b];
  const k = 1 + amt / 100;
  const l = lum(r, g, b);
  return [l + (r - l) * k, l + (g - l) * k, l + (b - l) * k];
}

/* ---------------- extração ---------------- */

/** Lado do thumbnail usado pelo k-means. 96×96 = 9216 amostras. */
const SAMPLE_SIDE = 96;
/** Iterações do k-means. Doze já estabiliza para k ≤ 8. */
const KMEANS_ITER = 12;

/**
 * Extrai `k` cores dominantes da fonte por k-means em RGB.
 *
 * Os centroides iniciais são pegos espalhados pela varredura da imagem, não
 * ao acaso: com semente aleatória a paleta mudava a cada clique no mesmo
 * arquivo, o que é péssimo pra quem está ajustando um pôster.
 *
 * A paleta sai ordenada da mais clara pra mais escura — é isso que faz
 * "Aplicar nos estados" já cair coerente com a escala tonal.
 *
 * @param {CanvasImageSource|null} source imagem, vídeo ou canvas
 * @param {number} k 2 a 8
 * @returns {number[][]} lista de [r,g,b] inteiros
 */
export function extractPalette(source, k) {
  if (!source) return [];

  const c = document.createElement('canvas');
  c.width = c.height = SAMPLE_SIDE;
  const x = c.getContext('2d', { willReadFrequently: true });
  try {
    x.drawImage(source, 0, 0, SAMPLE_SIDE, SAMPLE_SIDE);
  } catch {
    return []; // fonte ainda não tem quadro, ou canvas contaminado
  }

  let data;
  try {
    data = x.getImageData(0, 0, SAMPLE_SIDE, SAMPLE_SIDE).data;
  } catch {
    return [];
  }

  const pts = [];
  for (let i = 0; i < data.length; i += 4) pts.push([data[i], data[i + 1], data[i + 2]]);

  const cent = [];
  for (let i = 0; i < k; i++) {
    const p = pts[Math.floor((pts.length * (i + 0.5)) / k)];
    cent.push([p[0], p[1], p[2]]);
  }

  for (let it = 0; it < KMEANS_ITER; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < k; i++) {
        const dr = p[0] - cent[i][0];
        const dg = p[1] - cent[i][1];
        const db = p[2] - cent[i][2];
        const dd = dr * dr + dg * dg + db * db;
        if (dd < bd) {
          bd = dd;
          bi = i;
        }
      }
      sum[bi][0] += p[0];
      sum[bi][1] += p[1];
      sum[bi][2] += p[2];
      sum[bi][3]++;
    }
    for (let i = 0; i < k; i++) {
      if (sum[i][3]) {
        cent[i] = [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]];
      }
    }
  }

  cent.sort((a, b) => lum(b[0], b[1], b[2]) - lum(a[0], a[1], a[2]));
  return cent.map((p) => [Math.round(p[0]), Math.round(p[1]), Math.round(p[2])]);
}

/**
 * Cor da paleta mais próxima em distância euclidiana no cubo RGB.
 * @param {number[][]} palette
 * @returns {number[]}
 */
export function nearestPal(palette, r, g, b) {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i];
    const dr = r - p[0];
    const dg = g - p[1];
    const db = b - p[2];
    const dd = dr * dr + dg * dg + db * db;
    if (dd < bd) {
      bd = dd;
      bi = i;
    }
  }
  return palette[bi];
}

/**
 * Distribui uma paleta pelos N estados, do claro ao escuro, interpolando
 * quando a paleta tem menos cores que estados.
 *
 * @param {number[][]} palette
 * @param {number} n quantidade de estados
 * @returns {string[]} hex por estado
 */
export function spreadOverStates(palette, n) {
  if (!palette.length) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = palette.length === 1 ? 0 : (i * (palette.length - 1)) / (n - 1);
    const a = palette[Math.floor(t)];
    const b = palette[Math.ceil(t)];
    const f = t - Math.floor(t);
    out.push(
      rgb2hex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f)
    );
  }
  return out;
}

/* ---------------- cor da célula ---------------- */

/**
 * Passo de quantização por canal nos modos Pixel e Quantizar.
 *
 * Isto existe pelo cache de tints, não por estética: sem arredondar, uma foto
 * colorida pede uma cor nova quase toda célula e o cache vira um vazamento de
 * memória. Com passo 32 sobram 9 níveis por canal, 729 combinações por shape.
 * Na prática ninguém enxerga a diferença, porque a imagem já está abstraída
 * em células. Está documentado no manual — não mexa sem medir memória.
 */
const QUANT_STEP = 32;

/**
 * Decide a cor de uma célula segundo o modo de cor ativo.
 *
 * Roda uma vez por célula por quadro, então é escrita com argumentos
 * posicionais e sem alocar objeto.
 *
 * @param {'state'|'pixel'|'quant'} mode
 * @param {string} stateColor cor fixa do estado, usada no modo `state`
 * @param {Uint8ClampedArray|null} rgb dados RGBA da amostragem
 * @param {number} ci índice da célula
 * @param {number[][]} palette
 * @param {number} sat -100 a 100
 * @returns {string} hex
 */
export function cellColor(mode, stateColor, rgb, ci, palette, sat) {
  if (mode === 'state' || !rgb) return stateColor;

  const p = ci * 4;
  let r = rgb[p];
  let g = rgb[p + 1];
  let b = rgb[p + 2];

  if (mode === 'quant' && palette.length) {
    const q = nearestPal(palette, r, g, b);
    r = q[0];
    g = q[1];
    b = q[2];
  }
  if (sat) {
    const c = saturate(r, g, b, sat);
    r = c[0];
    g = c[1];
    b = c[2];
  }

  return rgb2hex(
    Math.round(r / QUANT_STEP) * QUANT_STEP,
    Math.round(g / QUANT_STEP) * QUANT_STEP,
    Math.round(b / QUANT_STEP) * QUANT_STEP
  );
}
