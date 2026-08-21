**English** · [Português](README.pt-BR.md)

# Shapes

## `default/`

The set bundled with the tool. These are the same seven SVGs that live as
constants in [`src/js/shapes.js`](../src/js/shapes.js) — duplicated on purpose:
in the code so the tool opens offline with no `fetch`, and here as files you can
open in Illustrator and use as a starting point.

| File | State | Filled area |
|---|---|---|
| `01-highlights-circulo-cheio.svg` | 1 · Highlights | 66.5% |
| `02-light-mid-quadrado-arredondado.svg` | 2 · Light mid | 62.5% |
| `03-mid-high-circulo-medio.svg` | 3 · Mid high | 36.3% |
| `04-midtones-losango.svg` | 4 · Midtones | 32.0% |
| `05-mid-low-anel.svg` | 5 · Mid low | 30.2% |
| `06-dark-mid-quadrado-pequeno.svg` | 6 · Dark mid | 7.8% |
| `07-shadows-ponto.svg` | 7 · Shadows | 1.5% |

The area has to keep falling from 1 to 7. `node scripts/check-ramp.mjs`
measures every shape geometrically and fails if the ramp ever climbs — it also
checks that these files still match the `DEFAULT_SVG` constant in the code.

If you change one of these files, **update the constant too** and run
`node scripts/build.mjs`. What the tool loads is the constant, not the file.

## `blocks/`

Squares that fill the whole cell at the highlight end and shrink toward the
shadows. Because state 1 is a full 100×100 square, neighbouring cells touch and
close into solid black areas — that is what gives the hard, printed, pixel-grid
look rather than a dotted one.

| File | State | Filled area |
|---|---|---|
| `01-highlights-bloco-cheio.svg` | 1 · Highlights | 100.0% |
| `02-light-mid-bloco-88.svg` | 2 · Light mid | 77.4% |
| `03-mid-high-bloco-74.svg` | 3 · Mid high | 54.8% |
| `04-midtones-bloco-58.svg` | 4 · Midtones | 33.6% |
| `05-mid-low-bloco-42.svg` | 5 · Mid low | 17.6% |
| `06-dark-mid-bloco-26.svg` | 6 · Dark mid | 6.8% |
| `07-shadows-bloco-12.svg` | 7 · Shadows | 1.4% |

The steps here are far more evenly spaced than in `default/`, so midtones read
smoother. Load it in one click with the [`blocos.json`](../examples/blocos.json)
preset.

## Drawing your own set

The long version — optical weight, why the ramp has to be monotonic, which
shape families suit which tonal zone, and the Illustrator workflow — is in
[`docs/shape-design.md`](../docs/shape-design.md).

The pocket summary:

1. **Square** 100×100 artboard.
2. One colour, strokes expanded, holes as compound paths.
3. 4 to 8% margin at the edges.
4. Filled area **decreasing** from state 1 to state 7, with no inverted step.
5. SVG 1.1, presentation attributes, no Illustrator editing data.

Upload each file with the `↑` button on its state. Once the set is good, hit
**Save preset** — the `.json` embeds the SVGs and you will not lose the work.

## Contributing a set

New shape sets are welcome as a sibling folder to `default/`, with a
descriptive name (`brutalist/`, `organic/`, `classic-halftone/`) and a short
`README.md` showing the ramp. See [CONTRIBUTING.md](../CONTRIBUTING.md).
