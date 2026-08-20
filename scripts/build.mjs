/**
 * build.mjs — gera `dist/index.html`, um arquivo único auto-contido.
 *
 * Node puro, zero dependência. Faz três coisas:
 *   1. troca cada <link rel="stylesheet"> local pelo CSS em <style>
 *   2. resolve o grafo de ES modules a partir de js/main.js e concatena
 *      tudo num <script> só, na ordem topológica
 *   3. escreve o resultado
 *
 * Uso:
 *   node scripts/build.mjs           gera dist/index.html
 *   node scripts/build.mjs --check   só confere se o dist está atualizado
 *
 * Sobre o passo 2: não é um bundler de verdade e não pretende ser. Ele aceita
 * um subconjunto pequeno e explícito de sintaxe de módulo, e ERRA ALTO ao
 * encontrar qualquer coisa fora dele. Um bundler silenciosamente errado é
 * muito pior que um build que não roda.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const ENTRY = 'js/main.js';

const CHECK_ONLY = process.argv.includes('--check');

/* ============ máscara léxica ============ */

/**
 * Devolve uma cópia do código com o conteúdo de comentários, strings,
 * templates e literais de regex trocado por espaços, preservando offsets e
 * quebras de linha.
 *
 * Existe porque as buscas por `import` e `export` são textuais. Sem isto,
 * um `@param {import('./x.js')}` num JSDoc é lido como import dinâmico e o
 * build reprova código correto — foi exatamente o que aconteceu.
 *
 * @param {string} src
 * @returns {string} mesmo comprimento do original
 */
function maskCode(src) {
  const out = src.split('');
  const n = src.length;
  let i = 0;
  /** último caractere significativo, pra distinguir regex de divisão */
  let prev = '';

  const blank = (from, to) => {
    for (let k = from; k < to && k < n; k++) {
      if (out[k] !== '\n') out[k] = ' ';
    }
  };

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];

    // comentário de linha
    if (c === '/' && d === '/') {
      let j = i;
      while (j < n && src[j] !== '\n') j++;
      blank(i, j);
      i = j;
      continue;
    }

    // comentário de bloco
    if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2);
      const j = end < 0 ? n : end + 2;
      blank(i, j);
      i = j;
      continue;
    }

    // string simples ou dupla
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === c || src[j] === '\n') break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      prev = c;
      continue;
    }

    // template literal, incluindo as interpolações
    if (c === '`') {
      let j = i + 1;
      let depth = 0;
      while (j < n) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '$' && src[j + 1] === '{') {
          depth++;
          j += 2;
          continue;
        }
        if (depth && src[j] === '}') {
          depth--;
          j++;
          continue;
        }
        if (!depth && src[j] === '`') break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      prev = '`';
      continue;
    }

    // literal de regex: só é regex se o token anterior não puder terminar
    // uma expressão (senão a barra é divisão)
    if (c === '/' && /^$|[=(,:[!&|?{};+\-*%<>~^]/.test(prev)) {
      let j = i + 1;
      let inClass = false;
      while (j < n) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        else if (src[j] === '\n') break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      prev = '/';
      continue;
    }

    if (!/\s/.test(c)) prev = c;
    i++;
  }

  return out.join('');
}

/**
 * Roda um regex global sobre a versão mascarada e devolve os matches com os
 * grupos de captura lidos do texto ORIGINAL, na mesma posição.
 *
 * @param {RegExp} re precisa ter a flag g
 * @param {string} raw
 * @param {string} masked
 * @returns {{index:number, length:number, groups:string[], text:string}[]}
 */
function matchOnMasked(re, raw, masked) {
  const found = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(masked))) {
    const text = raw.slice(m.index, m.index + m[0].length);
    const single = new RegExp(re.source, re.flags.replace('g', ''));
    const real = single.exec(text) || m;
    found.push({ index: m.index, length: m[0].length, groups: real.slice(1), text });
    if (m[0].length === 0) re.lastIndex++;
  }
  return found;
}

/* ============ leitura de módulos ============ */

/**
 * Resolve um specifier relativo em relação ao módulo que o importou.
 * @param {string} fromId caminho posix relativo a src/, ex.: "js/main.js"
 * @param {string} spec ex.: "./state.js"
 * @returns {string} id normalizado, ex.: "js/state.js"
 */
function resolveId(fromId, spec) {
  if (!spec.startsWith('.')) {
    throw new Error(
      `import de pacote não é suportado: "${spec}" em ${fromId}.\n` +
        `Esta ferramenta é zero-dependência de runtime, por decisão de produto.`
    );
  }
  return posix.normalize(posix.join(posix.dirname(fromId), spec));
}

/**
 * @typedef {object} Module
 * @property {string} id
 * @property {string} code corpo já sem import/export
 * @property {string[]} deps ids importados
 * @property {string} prelude linhas de ligação com os módulos importados
 * @property {string[]} exports nomes exportados
 */

/** Formas de export que este build aceita. Qualquer outra é erro. */
const RE = {
  importStmt:
    /^import\s+(?:(\{[\s\S]*?\})|(\*\s+as\s+[A-Za-z_$][\w$]*))\s+from\s+['"]([^'"]+)['"]\s*;?[ \t]*$/gm,
  badImport: /^import\s+(?!(?:\{|\*\s+as\s))[\s\S]*?from/gm,
  exportFn: /^export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
  exportConst: /^export\s+const\s+([A-Za-z_$][\w$]*)/gm,
  exportClass: /^export\s+class\s+([A-Za-z_$][\w$]*)/gm,
  exportList: /^export\s*\{([^}]*)\}\s*;?[ \t]*$/gm,
  exportMutable: /^export\s+(let|var)\s+/m,
  exportDefault: /^export\s+default\b/m,
  dynamicImport: /\bimport\s*\(/,
};

/**
 * Lê um módulo, extrai dependências e exports, e devolve o corpo transformado.
 * @param {string} id
 * @returns {Promise<Module>}
 */
async function loadModule(id) {
  const raw = await readFile(join(SRC, id), 'utf8');
  const masked = maskCode(raw);

  if (RE.exportMutable.test(masked)) {
    throw new Error(
      `${id}: "export let" / "export var" não é suportado.\n` +
        `O bundle copia o valor no momento do import, então uma ligação mutável\n` +
        `se comportaria diferente do ES module. Exponha um getter no lugar.`
    );
  }
  if (RE.exportDefault.test(masked)) {
    throw new Error(`${id}: "export default" não é suportado. Use export nomeado.`);
  }
  if (RE.dynamicImport.test(masked)) {
    throw new Error(`${id}: import() dinâmico não é suportado — o build é estático.`);
  }
  const bad = masked.match(RE.badImport);
  if (bad) {
    throw new Error(`${id}: forma de import não suportada:\n  ${bad[0].split('\n')[0]}`);
  }

  const deps = [];
  const preludeLines = [];

  /** trechos a remover do corpo, como [início, fim) */
  const cuts = [];

  /** o que cada dependência precisa exportar, pra conferir depois */
  const wants = [];

  for (const hit of matchOnMasked(RE.importStmt, raw, masked)) {
    const [named, namespace, spec] = hit.groups;
    const depId = resolveId(id, spec);
    deps.push(depId);
    if (namespace) {
      const alias = namespace.replace(/^\*\s+as\s+/, '').trim();
      preludeLines.push(`const ${alias} = __m[${JSON.stringify(depId)}];`);
    } else {
      const clause = named.replace(/\s+/g, ' ').trim();
      preludeLines.push(`const ${clause} = __m[${JSON.stringify(depId)}];`);
      for (const part of clause.replace(/[{}]/g, '').split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (name) wants.push({ from: depId, name });
      }
    }
    cuts.push([hit.index, hit.index + hit.length]);
  }

  // coleta os nomes exportados
  const exported = new Set();
  for (const hit of matchOnMasked(RE.exportFn, raw, masked)) exported.add(hit.groups[1]);
  for (const hit of matchOnMasked(RE.exportConst, raw, masked)) exported.add(hit.groups[0]);
  for (const hit of matchOnMasked(RE.exportClass, raw, masked)) exported.add(hit.groups[0]);
  for (const hit of matchOnMasked(RE.exportList, raw, masked)) {
    for (const part of hit.groups[0].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) exported.add(name);
    }
    cuts.push([hit.index, hit.index + hit.length]);
  }

  // a palavra-chave `export` de cada declaração também sai
  for (const hit of matchOnMasked(/^export[ \t]+/gm, raw, masked)) {
    cuts.push([hit.index, hit.index + hit.length]);
  }

  // `export { ... }` casa tanto na lista quanto no corte da palavra-chave:
  // funde os intervalos que se sobrepõem antes de aplicar
  cuts.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const cut of cuts) {
    const last = merged[merged.length - 1];
    if (last && cut[0] <= last[1]) last[1] = Math.max(last[1], cut[1]);
    else merged.push([...cut]);
  }

  // aplica de trás pra frente, pra não invalidar os offsets
  let code = raw;
  for (let k = merged.length - 1; k >= 0; k--) {
    code = code.slice(0, merged[k][0]) + code.slice(merged[k][1]);
  }

  return {
    id,
    code: code.trim(),
    deps,
    wants,
    prelude: preludeLines.join('\n'),
    exports: [...exported].sort(),
  };
}

/**
 * Confere que todo import nomeado existe no módulo de origem.
 *
 * Um ES module lançaria SyntaxError nesse caso, mas a desestruturação que o
 * bundle gera só produziria `undefined` — o erro apareceria muito longe da
 * causa, em tempo de execução. Então a checagem tem que ser aqui.
 *
 * @param {Module[]} modules
 */
function verifyImports(modules) {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const problems = [];

  for (const mod of modules) {
    for (const { from, name } of mod.wants) {
      const dep = byId.get(from);
      if (!dep) continue; // buildGraph já teria reclamado
      if (!dep.exports.includes(name)) {
        problems.push(
          `  ${mod.id} importa "${name}" de ${from}, que não exporta esse nome.\n` +
            `    ${from} exporta: ${dep.exports.join(', ') || '(nada)'}`
        );
      }
    }
  }

  if (problems.length) {
    throw new Error('import quebrado:\n' + problems.join('\n'));
  }
}

/**
 * Percorre o grafo a partir da entrada e devolve os módulos em ordem
 * topológica (dependência antes de quem depende).
 * @param {string} entry
 * @returns {Promise<Module[]>}
 */
async function buildGraph(entry) {
  /** @type {Map<string, Module>} */
  const seen = new Map();
  const order = [];
  const visiting = new Set();

  async function visit(id, stack) {
    if (seen.has(id) && !visiting.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(
        `dependência circular:\n  ${[...stack, id].join('\n  → ')}\n` +
          `O build concatena os módulos numa ordem só. Quebre o ciclo.`
      );
    }
    if (seen.has(id)) return;

    if (!existsSync(join(SRC, id))) {
      throw new Error(`módulo não encontrado: ${id} (importado em ${stack.at(-1) || 'entry'})`);
    }

    visiting.add(id);
    const mod = await loadModule(id);
    for (const dep of mod.deps) await visit(dep, [...stack, id]);
    visiting.delete(id);

    seen.set(id, mod);
    order.push(mod);
  }

  await visit(entry, []);
  return order;
}

/**
 * Costura os módulos num IIFE com um registro simples.
 * @param {Module[]} modules
 * @returns {string}
 */
function bundle(modules) {
  const parts = [
    '(function () {',
    "'use strict';",
    '/* bundle gerado por scripts/build.mjs — edite src/, nunca este arquivo */',
    'var __m = {};',
  ];

  for (const mod of modules) {
    const returns = mod.exports.length
      ? `return { ${mod.exports.map((n) => `${n}: ${n}`).join(', ')} };`
      : 'return {};';
    parts.push(
      '',
      `/* ---------- ${mod.id} ---------- */`,
      `__m[${JSON.stringify(mod.id)}] = (function () {`,
      mod.prelude,
      mod.code,
      returns,
      '})();'
    );
  }

  parts.push('})();');
  return parts.filter((p) => p !== '').join('\n') + '\n';
}

/* ============ montagem do HTML ============ */

const LINK_RE = /[ \t]*<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>\s*\n?/g;
const MODULE_SCRIPT_RE = /[ \t]*<script\s+type="module"\s+src="([^"]+)"\s*><\/script>\s*\n?/;
const FONT_URL_RE = /url\((['"]?)((?:\.\.?\/)[^)'"]+\.woff2)\1\)/g;

/**
 * Troca cada `url(../fonts/x.woff2)` por um data: URI em base64.
 *
 * É o que faz a tipografia viajar dentro do arquivo único. Sem isto o build
 * abriria com a fonte de sistema, e a promessa de rodar offline valeria só
 * pro código, não pro visual.
 *
 * @param {string} css
 * @param {string} cssPath caminho do css relativo a src/, pra resolver o url
 * @returns {Promise<{css:string, bytes:number}>}
 */
async function inlineFontUrls(css, cssPath) {
  const refs = [...css.matchAll(FONT_URL_RE)];
  if (!refs.length) return { css, bytes: 0 };

  let bytes = 0;
  let out = css;
  for (const ref of refs) {
    const rel = ref[2];
    const fontId = posix.normalize(posix.join(posix.dirname(cssPath), rel));
    const abs = join(SRC, fontId);
    if (!existsSync(abs)) {
      throw new Error(`fonte não encontrada: ${fontId} (referenciada em ${cssPath})`);
    }
    const buf = await readFile(abs);
    if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') {
      throw new Error(`${fontId} não é um woff2 válido (assinatura errada)`);
    }
    bytes += buf.length;
    const uri = `url(data:font/woff2;base64,${buf.toString('base64')})`;
    out = out.replace(ref[0], uri);
  }
  return { css: out, bytes };
}

async function build() {
  let html = await readFile(join(SRC, 'index.html'), 'utf8');

  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) {
    throw new Error(
      'src/index.html ainda referencia o Google Fonts.\n' +
        'As fontes são embutidas por src/styles/fonts.css — remova os <link> remotos,\n' +
        'senão o arquivo único faz requisição de rede e deixa de funcionar offline.'
    );
  }

  /* 1. CSS */
  const cssFiles = [];
  html = html.replace(LINK_RE, (match, href) => {
    if (/^https?:/i.test(href)) return match;
    cssFiles.push(href);
    return '__CSS_SLOT__' + (cssFiles.length - 1) + '__\n';
  });

  let fontBytes = 0;
  for (let i = 0; i < cssFiles.length; i++) {
    const raw = await readFile(join(SRC, cssFiles[i]), 'utf8');
    const { css, bytes } = await inlineFontUrls(raw, cssFiles[i]);
    fontBytes += bytes;
    const block = `<style>\n/* ---------- ${cssFiles[i]} ---------- */\n${css.trim()}\n</style>`;
    html = html.replace('__CSS_SLOT__' + i + '__', block);
  }

  /* 2. JS */
  const scriptMatch = html.match(MODULE_SCRIPT_RE);
  if (!scriptMatch) {
    throw new Error('não achei <script type="module" src="..."> no src/index.html');
  }
  const entry = scriptMatch[1].replace(/^\.\//, '');
  if (entry !== ENTRY) {
    throw new Error(`a entrada mudou: esperava ${ENTRY}, achei ${entry}`);
  }

  const modules = await buildGraph(entry);
  verifyImports(modules);
  const code = bundle(modules);

  if (code.includes('</script')) {
    throw new Error(
      'o código-fonte contém a sequência "</script", que fecharia a tag no ' +
        'arquivo único. Escreva "<\\/script" na string.'
    );
  }

  html = html.replace(MODULE_SCRIPT_RE, `<script>\n${code}</script>\n`);

  /* 3. cabeçalho */
  html = html.replace(
    '<head>',
    '<head>\n<!--\n  Build único gerado por scripts/build.mjs a partir de src/.\n' +
      '  Não edite este arquivo: as mudanças se perdem no próximo build.\n-->'
  );

  return { html, modules, fontBytes };
}

/* ============ execução ============ */

try {
  const { html, modules, fontBytes } = await build();
  const target = join(DIST, 'index.html');

  if (CHECK_ONLY) {
    if (!existsSync(target)) {
      console.error('\n  dist/index.html não existe. Rode: node scripts/build.mjs\n');
      process.exit(1);
    }
    const current = await readFile(target, 'utf8');
    if (current !== html) {
      console.error(
        '\n  dist/index.html está desatualizado em relação a src/.\n' +
          '  Rode `node scripts/build.mjs` e faça commit do resultado.\n'
      );
      process.exit(1);
    }
    console.log('  dist/index.html está em dia.');
  } else {
    await mkdir(DIST, { recursive: true });
    await writeFile(target, html, 'utf8');
    const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
    const fontKb = (fontBytes / 1024).toFixed(1);
    console.log(`\n  dist/index.html  ${kb} KB  ·  ${modules.length} módulos  ·  ${fontKb} KB de fonte embutida`);
    for (const m of modules) console.log(`    ${m.id}`);
    console.log('');
  }
} catch (err) {
  console.error('\n  build falhou: ' + err.message + '\n');
  process.exit(1);
}
