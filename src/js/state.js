/**
 * state.js — estado central da aplicação e um pub/sub mínimo.
 *
 * Este módulo não conhece o DOM. Ele guarda o que a ferramenta é num dado
 * momento: os parâmetros do render (`S`), os 7 slots de shape (`slots`) e a
 * paleta extraída. Quem desenha lê daqui; quem é interface escreve aqui.
 *
 * O pub/sub existe pra desacoplar: `renderer` e `main` reagem a mudanças sem
 * precisar se conhecer. Ele é síncrono e sem fila, de propósito — o loop de
 * render já roda a cada quadro, então não faz sentido agendar nada.
 */

import { DEFAULT_SVG } from './shapes.js';

/** Quantidade de faixas tonais. Mudar isso quebra o conceito da ferramenta. */
export const N = 7;

/** Rótulo e subtítulo de cada estado, do highlight à sombra. */
export const STATE_META = [
  ['STATE 1', 'Highlights'],
  ['STATE 2', 'Light mid'],
  ['STATE 3', 'Mid high'],
  ['STATE 4', 'Midtones'],
  ['STATE 5', 'Mid low'],
  ['STATE 6', 'Dark mid'],
  ['STATE 7', 'Shadows (100%)'],
];

/**
 * Parâmetros de render.
 *
 * `bg` é a cor de fundo da COMPOSIÇÃO — escolha artística do usuário.
 * Ela não tem nenhuma relação com o tema da interface e nunca deve ser
 * derivada de um token de CSS.
 *
 * @typedef {'state'|'pixel'|'quant'} ColorMode
 */
export const S = {
  cols: 80,
  bg: '#000000',
  fill: true,
  invert: false,
  scale: false,
  minS: 30,
  maxS: 100,
  rot: false,
  rotInt: 400,
  bri: 0,
  con: 0,
  gam: 1,
  res: 1440,
  /** exporta PNG e SVG sem o retângulo de fundo */
  alpha: false,
  square: false,
  playing: true,
  /** @type {ColorMode} */
  cmode: 'state',
  palN: 5,
  sat: 0,
  autoPal: true,
};

/** Cópia dos padrões, pra `reset()` e pra validar preset. */
const S_DEFAULTS = { ...S };

/**
 * Um slot por faixa tonal.
 * @typedef {object} Slot
 * @property {boolean} on          estado ligado ou desligado
 * @property {string}  color       cor do estado, hex
 * @property {string}  svgText     código-fonte do SVG
 * @property {HTMLImageElement|null} img  imagem já rasterizada
 * @property {boolean} dirtyImg    marca que o svgText mudou
 * @property {string}  name        nome do arquivo, ou 'padrão'
 * @property {string|null} error   mensagem de erro do último carregamento
 */

/** @type {Slot[]} */
export const slots = [];
for (let i = 0; i < N; i++) {
  slots.push({
    on: true,
    color: '#ffffff',
    svgText: DEFAULT_SVG[i],
    img: null,
    dirtyImg: false,
    name: 'padrão',
    error: null,
  });
}

/** Paleta extraída da imagem, ordenada da mais clara pra mais escura. */
let palette = /** @type {number[][]} */ ([]);

/* ---------------- pub/sub ---------------- */

const listeners = new Set();

/**
 * Registra um ouvinte de mudança de estado.
 * @param {(key:string, value:*) => void} fn
 * @returns {() => void} função pra cancelar a inscrição
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Dispara os ouvintes. Público porque quem muta `slots` direto
 * (upload de SVG, toggle de estado) precisa avisar.
 * @param {string} key
 * @param {*} [value]
 */
export function emit(key, value) {
  for (const fn of listeners) fn(key, value);
}

/* ---------------- acesso ---------------- */

/**
 * Lê um parâmetro de render.
 * @param {keyof typeof S} key
 */
export function get(key) {
  return S[key];
}

/**
 * Escreve um parâmetro de render e notifica, se de fato mudou.
 * @param {keyof typeof S} key
 * @param {*} value
 */
export function set(key, value) {
  if (S[key] === value) return;
  S[key] = value;
  emit(key, value);
}

/** @returns {number[][]} a paleta atual */
export function getPalette() {
  return palette;
}

/**
 * Substitui a paleta e notifica.
 * @param {number[][]} next
 */
export function setPalette(next) {
  palette = Array.isArray(next) ? next : [];
  emit('palette', palette);
}

/** Volta os parâmetros de render aos valores de fábrica. Não mexe nos slots. */
export function resetParams() {
  Object.assign(S, S_DEFAULTS);
  emit('reset');
}

/** @returns {object} cópia dos parâmetros padrão, pra validação de preset */
export function defaults() {
  return { ...S_DEFAULTS };
}
