/**
 * gen-shape-sets.mjs — gera src/js/shape-sets.js a partir das pastas de
 * shapes/.
 *
 * Por que gerar em vez de escrever à mão: a ferramenta abre com duplo clique,
 * de `file://`, sem servidor. Ela não pode dar `fetch` em shapes/ — os SVGs
 * precisam estar embutidos no código. Mas manter a mesma coisa em dois lugares
 * é convite pra dessincronizar, e já aconteceu uma vez com o DEFAULT_SVG.
 *
 * Então a pasta é a fonte da verdade e o módulo é derivado dela.
 *
 * Uso:
 *   node scripts/gen-shape-sets.mjs           regrava o módulo
 *   node scripts/gen-shape-sets.mjs --check   falha se estiver desatualizado
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHAPES_ROOT = join(ROOT, 'shapes');
const TARGET = join(ROOT, 'src', 'js', 'shape-sets.js');

const CHECK_ONLY = process.argv.includes('--check');

/**
 * Rótulo humano de cada conjunto, nos dois idiomas. Conjunto novo sem entrada
 * aqui é erro: melhor falhar do que aparecer na interface com o nome da pasta.
 */
const LABELS = {
  default: { pt: 'Padrão · densidade', en: 'Default · density' },
  dots: { pt: 'Pontos · por tamanho', en: 'Dots · by size' },
  blocks: { pt: 'Blocos · quadrados', en: 'Blocks · squares' },
  complexity: { pt: 'Complexidade', en: 'Complexity' },
  'bitmap-4': { pt: 'Bitmap 4×4 · dithering', en: 'Bitmap 4×4 · dither' },
};

/** Ordem em que aparecem no seletor. */
const ORDER = ['default', 'dots', 'blocks', 'bitmap-4', 'complexity'];

/**
 * Normaliza o SVG pro formato embutido: uma linha só, e sem width/height na
 * tag `<svg>` raiz — a ferramenta reescreve essas dimensões na hora de
 * rasterizar.
 *
 * O corte é feito SÓ na tag de abertura do `<svg>`. Uma versão anterior disto
 * usava um replace global e arrancava o width/height dos `<rect>` de dentro,
 * deixando os quadrados sem tamanho.
 */
function normalize(svg) {
  const flat = svg.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return flat.replace(/^<svg\b[^>]*>/, (openTag) =>
    openTag.replace(/\s+(width|height)="[^"]*"/g, '')
  );
}

const dirs = (await readdir(SHAPES_ROOT, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const unknown = dirs.filter((d) => !LABELS[d]);
if (unknown.length) {
  console.error(
    `\n  conjunto sem rótulo: ${unknown.join(', ')}\n` +
      `  adicione uma entrada em LABELS e em ORDER dentro de scripts/gen-shape-sets.mjs\n`
  );
  process.exit(1);
}

const sets = [];
for (const id of ORDER) {
  if (!dirs.includes(id)) continue;
  const files = (await readdir(join(SHAPES_ROOT, id))).filter((f) => f.endsWith('.svg')).sort();
  if (files.length !== 7) {
    console.error(`\n  shapes/${id}/ tem ${files.length} svg, precisa ter 7\n`);
    process.exit(1);
  }
  const svgs = [];
  for (const f of files) {
    svgs.push(normalize(await readFile(join(SHAPES_ROOT, id, f), 'utf8')));
  }
  sets.push({ id, labels: LABELS[id], svgs });
}

const body = sets
  .map(
    (s) =>
      `  {\n` +
      `    id: ${JSON.stringify(s.id)},\n` +
      `    labels: { pt: ${JSON.stringify(s.labels.pt)}, en: ${JSON.stringify(s.labels.en)} },\n` +
      `    svgs: [\n` +
      s.svgs.map((v) => `      ${JSON.stringify(v)},`).join('\n') +
      `\n    ],\n` +
      `  },`
  )
  .join('\n');

const out = `/**
 * shape-sets.js — ARQUIVO GERADO. Não edite à mão.
 *
 * Gerado por scripts/gen-shape-sets.mjs a partir das pastas de shapes/.
 * Pra mudar uma shape, edite o .svg na pasta e rode:
 *
 *   node scripts/gen-shape-sets.mjs
 *
 * Os SVGs ficam embutidos porque a ferramenta roda de file://, sem servidor,
 * e não pode buscar arquivo nenhum em disco.
 *
 * @typedef {object} ShapeSet
 * @property {string} id
 * @property {{pt:string, en:string}} labels
 * @property {string[]} svgs sete, do highlight à sombra
 */

/** @type {ShapeSet[]} */
export const SHAPE_SETS = [
${body}
];

/**
 * Busca um conjunto pelo id.
 * @param {string} id
 * @returns {ShapeSet|undefined}
 */
export function findShapeSet(id) {
  return SHAPE_SETS.find((s) => s.id === id);
}
`;

if (CHECK_ONLY) {
  let current = '';
  try {
    current = await readFile(TARGET, 'utf8');
  } catch {
    console.error('\n  src/js/shape-sets.js não existe. Rode: node scripts/gen-shape-sets.mjs\n');
    process.exit(1);
  }
  if (current !== out) {
    console.error(
      '\n  src/js/shape-sets.js está desatualizado em relação a shapes/.\n' +
        '  Rode `node scripts/gen-shape-sets.mjs` e faça commit do resultado.\n'
    );
    process.exit(1);
  }
  console.log(`  shape-sets.js está em dia (${sets.length} conjuntos).`);
} else {
  await writeFile(TARGET, out, 'utf8');
  console.log(`\n  src/js/shape-sets.js  ·  ${sets.length} conjuntos`);
  for (const s of sets) console.log(`    ${s.id.padEnd(12)} ${s.labels.pt}`);
  console.log('');
}
