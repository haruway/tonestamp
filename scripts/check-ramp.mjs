/**
 * check-ramp.mjs — confere que o conjunto padrão de shapes é uma rampa
 * monotônica de área preenchida.
 *
 * Essa é a regra número um do projeto: se o estado 4 depositar mais tinta que
 * o estado 3, a imagem quebra — aparece relevo falso e o rosto some. Está
 * escrito em docs/shape-design.md como o erro mais comum, e mesmo assim o
 * conjunto original tinha duas inversões. Daí este script existir.
 *
 * Também confere que os arquivos em shapes/default/ batem com a constante
 * DEFAULT_SVG de src/js/shapes.js. Os dois existem de propósito — o código
 * embute pra rodar offline, os arquivos servem pra abrir no Illustrator — e é
 * fácil mexer num e esquecer do outro.
 *
 * Uso: node scripts/check-ramp.mjs
 * Sai com 1 se a rampa inverter ou se os arquivos divergirem do código.
 *
 * A área sai de cálculo geométrico, não de rasterização: arcos são achatados
 * em segmentos de reta e o polígono resultante vai pra fórmula do shoelace.
 * Com 720 segmentos por arco o erro é irrelevante pro que se está medindo.
 */

import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHAPES_DIR = join(ROOT, 'shapes', 'default');
const SHAPES_JS = join(ROOT, 'src', 'js', 'shapes.js');

/** Segmentos por arco no achatamento. */
const ARC_STEPS = 720;

/* ---------------- geometria ---------------- */

/**
 * Área do polígono pela fórmula do shoelace. Sinal indica orientação.
 * @param {number[][]} pts
 */
function shoelace(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Converte um arco elíptico do SVG da forma "endpoint" pra "center", conforme
 * o apêndice F.6 da spec, e devolve pontos ao longo dele.
 */
function arcPoints(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;

  // corrige raios pequenos demais pra alcançar o outro ponto
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = Math.sqrt(Math.max(0, num / den));
  if (largeArc === sweep) coef = -coef;

  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry
  );
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const pts = [];
  for (let i = 1; i <= ARC_STEPS; i++) {
    const t = theta1 + (dTheta * i) / ARC_STEPS;
    const px = cosP * rx * Math.cos(t) - sinP * ry * Math.sin(t) + cx;
    const py = sinP * rx * Math.cos(t) + cosP * ry * Math.sin(t) + cy;
    pts.push([px, py]);
  }
  return pts;
}

/**
 * Percorre um atributo `d` e devolve os subcaminhos já achatados em polígonos.
 * Aceita M/L/H/V/A/Z nas formas absoluta e relativa, e coordenadas implícitas
 * depois de um M (que a spec trata como L). Erra alto em curvas de Bézier:
 * medir área delas exigiria bem mais código, e nenhuma shape padrão usa.
 *
 * @param {string} d
 * @returns {number[][][]}
 */
function flattenPath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const subpaths = [];
  let current = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = '';
  let i = 0;

  const num = () => parseFloat(tokens[i++]);
  const flush = () => {
    if (current.length > 2) subpaths.push(current);
    current = [];
  };

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/[a-zA-Z]/.test(tok)) {
      cmd = tok;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        flush();
        x = startX;
        y = startY;
        continue;
      }
    }
    if (/[CcSsQqTt]/.test(cmd)) {
      throw new Error(`comando "${cmd}" (Bézier) não é suportado pelo medidor de área`);
    }

    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': {
        const nx = num();
        const ny = num();
        flush();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        startX = x;
        startY = y;
        current = [[x, y]];
        // coordenadas seguintes depois de um M valem como L
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L': {
        const nx = num();
        const ny = num();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        current.push([x, y]);
        break;
      }
      case 'H': {
        const nx = num();
        x = rel ? x + nx : nx;
        current.push([x, y]);
        break;
      }
      case 'V': {
        const ny = num();
        y = rel ? y + ny : ny;
        current.push([x, y]);
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const rot = num();
        const laf = num();
        const sf = num();
        const nx = num();
        const ny = num();
        const ex = rel ? x + nx : nx;
        const ey = rel ? y + ny : ny;
        for (const p of arcPoints(x, y, rx, ry, rot, laf, sf, ex, ey)) current.push(p);
        x = ex;
        y = ey;
        break;
      }
      default:
        throw new Error(`comando de path desconhecido: "${cmd}"`);
    }
  }
  flush();
  return subpaths;
}

/**
 * Área preenchida de um SVG, como fração da caixa do viewBox.
 *
 * Subcaminhos aninhados com orientação oposta se cancelam, que é como um furo
 * funciona tanto em nonzero quanto em evenodd bem desenhado.
 *
 * @param {string} svg
 * @returns {number} 0..1
 */
export function filledFraction(svg) {
  const vb = svg.match(/viewBox="([^"]+)"/);
  if (!vb) throw new Error('sem viewBox');
  const [, , , vw, vh] = [null, ...vb[1].trim().split(/[\s,]+/).map(Number)];
  const boxArea = vw * vh;

  let signed = 0;
  let found = 0;

  for (const m of svg.matchAll(/<circle\b[^>]*>/g)) {
    const r = parseFloat((m[0].match(/\br="([^"]+)"/) || [])[1]);
    if (!Number.isFinite(r)) continue;
    signed += Math.PI * r * r;
    found++;
  }

  for (const m of svg.matchAll(/<rect\b[^>]*>/g)) {
    const g = (a) => parseFloat((m[0].match(new RegExp(`\\b${a}="([^"]+)"`)) || [])[1]);
    const w = g('width');
    const h = g('height');
    if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
    const rx = Number.isFinite(g('rx')) ? g('rx') : 0;
    const ry = Number.isFinite(g('ry')) ? g('ry') : rx;
    // os quatro cantos arredondados tiram (4 - π)·rx·ry da caixa
    signed += w * h - (4 - Math.PI) * rx * ry;
    found++;
  }

  for (const m of svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*>/g)) {
    for (const poly of flattenPath(m[1])) signed += shoelace(poly);
    found++;
  }

  if (!found) throw new Error('nenhuma forma reconhecida (circle, rect ou path)');
  return Math.abs(signed) / boxArea;
}

/* ---------------- execução ---------------- */

const files = (await readdir(SHAPES_DIR)).filter((f) => f.endsWith('.svg')).sort();

if (files.length !== 7) {
  console.error(`\n  shapes/default/ precisa ter 7 svg, achei ${files.length}.\n`);
  process.exit(1);
}

const shapesJs = await readFile(SHAPES_JS, 'utf8');
const embedded = [...shapesJs.matchAll(/`(<svg[\s\S]*?<\/svg>)`/g)].map((m) => m[1]);

let failures = 0;
const rows = [];

console.log('\n  rampa de área preenchida — shapes/default/');
console.log('  ' + '-'.repeat(68));

let previous = Infinity;
for (let i = 0; i < files.length; i++) {
  const svg = (await readFile(join(SHAPES_DIR, files[i]), 'utf8')).trim();
  let pct;
  try {
    pct = filledFraction(svg) * 100;
  } catch (err) {
    console.error(`  XX ${files[i]} — ${err.message}`);
    failures++;
    continue;
  }

  const drops = pct < previous;
  if (!drops) failures++;
  const delta = previous === Infinity ? '' : (pct - previous).toFixed(1).padStart(7);

  console.log(
    `  ${drops ? 'ok' : 'XX'}  ${String(i + 1)}  ${files[i].padEnd(40)} ${pct.toFixed(1).padStart(5)}%  ${delta}`
  );
  rows.push({ file: files[i], pct });
  previous = pct;
}

/* os arquivos têm que bater com a constante embutida no código */
console.log('\n  arquivos × constante DEFAULT_SVG');
console.log('  ' + '-'.repeat(68));
if (embedded.length !== 7) {
  console.error(`  XX  achei ${embedded.length} svg em src/js/shapes.js, esperava 7`);
  failures++;
} else {
  const norm = (s) => s.replace(/\s+/g, ' ').replace(/\s*(width|height)="[^"]*"/g, '').trim();
  for (let i = 0; i < 7; i++) {
    const fileSvg = norm((await readFile(join(SHAPES_DIR, files[i]), 'utf8')).trim());
    const codeSvg = norm(embedded[i]);
    const same = fileSvg === codeSvg;
    if (!same) failures++;
    console.log(`  ${same ? 'ok' : 'XX'}  ${files[i]}`);
    if (!same) {
      console.log(`        arquivo: ${fileSvg.slice(0, 90)}`);
      console.log(`        código:  ${codeSvg.slice(0, 90)}`);
    }
  }
}

console.log('');
if (failures) {
  console.error(
    `  ${failures} problema(s).\n\n` +
      '  Uma rampa que sobe em algum ponto faz aparecer relevo falso na imagem.\n' +
      '  Veja docs/shape-design.md, "O princípio: peso óptico, não desenho".\n'
  );
  process.exit(1);
}
console.log('  rampa monotônica e arquivos em sincronia com o código.\n');
