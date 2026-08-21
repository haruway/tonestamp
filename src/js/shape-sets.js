/**
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
  {
    id: "default",
    labels: { pt: "Padrão · densidade", en: "Default · density" },
    svgs: [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"46\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" rx=\"13\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M50 10 90 50 50 90 10 50Z\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M50 12a38 38 0 1 1 0 76 38 38 0 0 1 0-76Zm0 16a22 22 0 1 0 0 44 22 22 0 0 0 0-44Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"36\" y=\"36\" width=\"28\" height=\"28\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"7\" fill=\"#fff\"/></svg>",
    ],
  },
  {
    id: "dots",
    labels: { pt: "Pontos · por tamanho", en: "Dots · by size" },
    svgs: [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"46\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"38\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"30\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"22\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"16\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"10\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"5\" fill=\"#fff\"/></svg>",
    ],
  },
  {
    id: "blocks",
    labels: { pt: "Blocos · quadrados", en: "Blocks · squares" },
    svgs: [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"6\" y=\"6\" width=\"88\" height=\"88\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"13\" y=\"13\" width=\"74\" height=\"74\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"21\" y=\"21\" width=\"58\" height=\"58\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"29\" y=\"29\" width=\"42\" height=\"42\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"37\" y=\"37\" width=\"26\" height=\"26\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"44\" y=\"44\" width=\"12\" height=\"12\" fill=\"#fff\"/></svg>",
    ],
  },
  {
    id: "bitmap-4",
    labels: { pt: "Bitmap 4×4 · dithering", en: "Bitmap 4×4 · dither" },
    svgs: [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"0\" y=\"50\" width=\"100\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"75\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"0\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"50\" width=\"50\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"0\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"75\" y=\"75\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"25\" y=\"25\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"0\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/><rect x=\"50\" y=\"50\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"0\" y=\"0\" width=\"25\" height=\"25\" fill=\"#fff\"/></svg>",
    ],
  },
  {
    id: "complexity",
    labels: { pt: "Complexidade", en: "Complexity" },
    svgs: [
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M50 4a46 46 0 1 1 0 92 46 46 0 0 1 0-92Zm0 8a38 38 0 1 0 0 76 38 38 0 0 0 0-76ZM50 20a30 30 0 1 1 0 60 30 30 0 0 1 0-60Zm0 7a23 23 0 1 0 0 46 23 23 0 0 0 0-46ZM50 36a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M50 4a46 46 0 1 1 0 92 46 46 0 0 1 0-92Zm0 8a38 38 0 1 0 0 76 38 38 0 0 0 0-76ZM50 22a28 28 0 1 1 0 56 28 28 0 0 1 0-56Zm0 8a20 20 0 1 0 0 40 20 20 0 0 0 0-40Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M50 4a46 46 0 1 1 0 92 46 46 0 0 1 0-92Zm0 7a39 39 0 1 0 0 78 39 39 0 0 0 0-78ZM50 37a13 13 0 1 1 0 26 13 13 0 0 1 0-26Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" fill-rule=\"evenodd\" d=\"M50 4a46 46 0 1 1 0 92 46 46 0 0 1 0-92Zm0 7a39 39 0 1 0 0 78 39 39 0 0 0 0-78Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"#fff\" d=\"M8 45h84v10H8Z M45 8h10v84H45Z\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"8\" y=\"45\" width=\"84\" height=\"10\" fill=\"#fff\"/></svg>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"8\" fill=\"#fff\"/></svg>",
    ],
  },
];

/**
 * Busca um conjunto pelo id.
 * @param {string} id
 * @returns {ShapeSet|undefined}
 */
export function findShapeSet(id) {
  return SHAPE_SETS.find((s) => s.id === id);
}
