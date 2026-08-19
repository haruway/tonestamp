/**
 * contrast.mjs — verificador de contraste WCAG dos tokens de tema.
 *
 * Lê src/styles/tokens.css, extrai as custom properties de cada tema e
 * confere os pares de cor que realmente aparecem na interface contra o
 * mínimo AA (4.5:1 pra texto normal, 3:1 pra texto grande e UI).
 *
 * Uso: node scripts/contrast.mjs
 * Sai com código 1 se algum par obrigatório reprovar.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(ROOT, 'src', 'styles', 'tokens.css');

/* ---------- matemática de contraste (WCAG 2.1) ---------- */

/** Converte `#rgb` ou `#rrggbb` em [r,g,b] 0..255. */
function hex2rgb(hex) {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Luminância relativa conforme WCAG. */
function relLuminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Razão de contraste entre duas cores hex, de 1 a 21. */
export function contrast(a, b) {
  const la = relLuminance(hex2rgb(a));
  const lb = relLuminance(hex2rgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- leitura dos tokens ---------- */

/**
 * Extrai as custom properties de cada bloco `[data-theme="..."]`.
 * @returns {Record<string, Record<string,string>>}
 */
function parseThemes(css) {
  const themes = {};
  const blockRe = /\[data-theme=["']([a-z]+)["']\]\s*\{([^}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css))) {
    const [, name, body] = m;
    const vars = (themes[name] ??= {});
    const varRe = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let v;
    while ((v = varRe.exec(body))) vars[v[1]] = v[2].trim();
  }
  return themes;
}

/* ---------- pares que a interface realmente usa ---------- */

/**
 * Pares conferidos.
 *
 * `waive` marca um par que reprova de propósito, com o motivo. Ressalva não
 * é desculpa: é uma dívida registrada, que aparece no relatório toda vez.
 *
 * @type {{label:string, fg:string, bg:string, min:number,
 *         waive?:Record<string,string>}[]}
 */
const PAIRS = [
  { label: 'texto do painel', fg: 'ink', bg: 'panel', min: 4.5 },
  { label: 'texto sobre o stage', fg: 'ink', bg: 'bg', min: 4.5 },
  { label: 'texto secundário no painel', fg: 'dim', bg: 'panel', min: 4.5 },
  { label: 'texto secundário no stage', fg: 'dim', bg: 'bg', min: 4.5 },
  {
    label: 'texto secundário no card de estado',
    fg: 'dim',
    bg: 'panel-2',
    min: 4.5,
    waive: {
      dark: 'paleta escura original do protótipo, fixada pelo PRD. Faltam 0,16 pontos; corrigir exige mexer em --dim ou --panel-2.',
    },
  },
  { label: 'valor de destaque no painel', fg: 'acid', bg: 'panel', min: 4.5 },
  { label: 'valor de destaque no card de estado', fg: 'acid', bg: 'panel-2', min: 4.5 },
  { label: 'aviso / warning', fg: 'hot', bg: 'panel', min: 4.5 },
  { label: 'texto sobre botão primário', fg: 'on-accent', bg: 'acid', min: 4.5 },
  {
    label: 'texto sobre botão de gravação',
    fg: 'on-hot',
    bg: 'hot',
    min: 4.5,
    waive: {
      dark: 'branco sobre #ff2ea8, do protótipo. Passa em 3:1 (componente de UI), não em 4.5:1. Só aparece durante a gravação.',
    },
  },
  {
    label: 'borda / divisória',
    fg: 'line',
    bg: 'panel',
    min: 1.6,
    waive: {
      dark: 'borda decorativa: nenhum controle depende só dela pra ser identificado.',
      light: 'idem.',
    },
  },
  { label: 'foco visível sobre o painel', fg: 'acid', bg: 'panel', min: 3 },
];

/* ---------- execução ---------- */

const css = await readFile(TOKENS, 'utf8');
const themes = parseThemes(css);
const names = Object.keys(themes);

if (!names.length) {
  console.error('nenhum bloco [data-theme] encontrado em tokens.css');
  process.exit(1);
}

let failures = 0;
const waived = [];

for (const theme of names) {
  const vars = themes[theme];
  console.log(`\n  tema ${theme}`);
  console.log('  ' + '-'.repeat(66));

  for (const pair of PAIRS) {
    const fg = vars[pair.fg];
    const bg = vars[pair.bg];

    if (!fg || !bg) {
      console.log(`  ??  ${pair.label.padEnd(38)} token ausente (${pair.fg}/${pair.bg})`);
      failures++;
      continue;
    }
    if (!fg.startsWith('#') || !bg.startsWith('#')) continue;

    const ratio = contrast(fg, bg);
    const passes = ratio >= pair.min;
    const reason = pair.waive && pair.waive[theme];

    let mark = 'ok ';
    if (!passes && reason) {
      mark = '~~ ';
      waived.push({ theme, label: pair.label, ratio, min: pair.min, reason });
    } else if (!passes) {
      mark = 'XX ';
      failures++;
    }

    console.log(
      `  ${mark} ${pair.label.padEnd(38)} ${ratio.toFixed(2).padStart(5)}:1  ` +
        `(min ${pair.min})  ${fg} / ${bg}`
    );
  }
}

if (waived.length) {
  console.log('\n  ressalvas conhecidas (~~)');
  console.log('  ' + '-'.repeat(66));
  for (const w of waived) {
    console.log(`  ${w.theme} · ${w.label} — ${w.ratio.toFixed(2)}:1, exigido ${w.min}:1`);
    console.log(`     ${w.reason}`);
  }
}

console.log('');
if (failures) {
  console.error(`  ${failures} par(es) reprovados sem ressalva.\n`);
  process.exit(1);
}
console.log('  nenhuma reprovação sem ressalva.\n');
