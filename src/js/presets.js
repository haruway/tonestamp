/**
 * presets.js — salvar e carregar a configuração inteira como JSON.
 *
 * O preset embute os SVGs como string, não como caminho de arquivo. Um preset
 * tem que atravessar máquina, e-mail e pendrive sem levar uma pasta junto.
 *
 * Tudo que entra é tratado como hostil: o arquivo pode ter sido editado à mão,
 * pode ser de uma versão futura, pode ser um JSON qualquer que o usuário
 * arrastou por engano. Nada disso pode deixar a ferramenta em tela branca.
 */

import { S, slots, N, setPalette, emit } from './state.js';

/** Versão do formato. Suba quando a forma do JSON mudar de maneira incompatível. */
export const PRESET_VERSION = 1;

const FORMAT_ID = 'tonestamp-preset';

/**
 * Faixa válida de cada parâmetro numérico, espelhando os sliders da interface.
 * Serve pra validar e pra fazer clamp de preset editado na mão.
 * @type {Record<string, [number, number]>}
 */
const RANGES = {
  cols: [8, 220],
  minS: [0, 100],
  maxS: [0, 140],
  rotInt: [40, 2000],
  bri: [-100, 100],
  con: [-100, 100],
  gam: [0.3, 3],
  res: [600, 3000],
  palN: [2, 8],
  sat: [-100, 100],
};

const BOOLS = ['fill', 'invert', 'scale', 'rot', 'square', 'playing', 'autoPal'];
const MODES = ['state', 'pixel', 'quant'];
const HEX_RE = /^#[0-9a-f]{6}$/i;

/* ---------------- montar ---------------- */

/**
 * Monta o objeto do preset a partir do estado atual.
 * @param {number[][]} palette
 * @returns {object}
 */
export function buildPreset(palette) {
  const params = {};
  for (const key of Object.keys(S)) params[key] = S[key];

  return {
    format: FORMAT_ID,
    version: PRESET_VERSION,
    created: new Date().toISOString(),
    params,
    states: slots.map((s) => ({
      on: !!s.on,
      color: s.color,
      name: s.name,
      svgText: s.svgText || '',
    })),
    palette: (palette || []).map((p) => [p[0], p[1], p[2]]),
  };
}

/**
 * Serializa e dispara o download do preset.
 * @param {number[][]} palette
 */
export function downloadPreset(palette) {
  const json = JSON.stringify(buildPreset(palette), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.download = 'tonestamp-preset-' + Date.now() + '.json';
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ---------------- validar ---------------- */

/**
 * Lê e valida um preset. Nunca lança.
 *
 * O erro volta como CHAVE de tradução mais as variáveis pra interpolar. Este
 * módulo não conhece idioma; quem monta a frase é o main.js.
 *
 * @param {string} text conteúdo do arquivo
 * @returns {{ok:true, data:object} | {ok:false, error:string, vars?:object}}
 */
export function parsePreset(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'err.preset.json' };
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'err.preset.notObject' };
  }
  if (obj.format !== FORMAT_ID) {
    return { ok: false, error: 'err.preset.format' };
  }

  const version = Number(obj.version);
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'err.preset.noVersion' };
  }
  if (version > PRESET_VERSION) {
    return {
      ok: false,
      error: 'err.preset.newer',
      vars: { found: version, max: PRESET_VERSION },
    };
  }

  if (!obj.params || typeof obj.params !== 'object') {
    return { ok: false, error: 'err.preset.noParams' };
  }
  if (!Array.isArray(obj.states) || obj.states.length !== N) {
    return { ok: false, error: 'err.preset.stateCount', vars: { n: N } };
  }
  for (let i = 0; i < N; i++) {
    const st = obj.states[i];
    if (!st || typeof st !== 'object') {
      return { ok: false, error: 'err.preset.stateCorrupt', vars: { i: i + 1 } };
    }
    if (typeof st.svgText !== 'string') {
      return { ok: false, error: 'err.preset.stateNoSvg', vars: { i: i + 1 } };
    }
    if (typeof st.color !== 'string' || !HEX_RE.test(st.color)) {
      return { ok: false, error: 'err.preset.stateColor', vars: { i: i + 1 } };
    }
  }

  return { ok: true, data: obj };
}

/* ---------------- aplicar ---------------- */

function clamp(v, [lo, hi]) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Aplica um preset já validado ao estado. Emite `preset` no fim, uma vez só —
 * a interface se re-sincroniza inteira em vez de reagir a quinze eventos.
 *
 * @param {object} data preset validado por `parsePreset`
 */
export function applyPreset(data) {
  const p = data.params || {};

  for (const [key, range] of Object.entries(RANGES)) {
    const v = Number(p[key]);
    if (Number.isFinite(v)) S[key] = clamp(v, range);
  }
  for (const key of BOOLS) {
    if (typeof p[key] === 'boolean') S[key] = p[key];
  }
  if (typeof p.bg === 'string' && HEX_RE.test(p.bg)) S.bg = p.bg;
  if (MODES.includes(p.cmode)) S.cmode = p.cmode;

  // cols e res chegam como inteiro
  S.cols = Math.round(S.cols);
  S.res = Math.round(S.res);
  S.palN = Math.round(S.palN);

  data.states.forEach((st, i) => {
    const slot = slots[i];
    slot.on = !!st.on;
    slot.color = st.color;
    slot.svgText = st.svgText;
    slot.name = typeof st.name === 'string' && st.name ? st.name : 'preset';
    slot.dirtyImg = true;
    slot.error = null;
  });

  const pal = Array.isArray(data.palette)
    ? data.palette
        .filter((c) => Array.isArray(c) && c.length >= 3 && c.every((n) => Number.isFinite(n)))
        .map((c) => [
          Math.max(0, Math.min(255, Math.round(c[0]))),
          Math.max(0, Math.min(255, Math.round(c[1]))),
          Math.max(0, Math.min(255, Math.round(c[2]))),
        ])
    : [];
  setPalette(pal);

  emit('preset', data);
}
