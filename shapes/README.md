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

## `bitmap-4/`

Not a shape that shrinks — a **4×4 sub-grid whose cells fill up**. This is
classic ordered dithering, and it is what produces the hard, printed,
maximum-contrast look: state 1 is a fully solid cell with no gap at all, so
neighbouring cells merge into unbroken black.

| File | Cells | Filled area |
|---|---|---|
| `01-highlights-16de16.svg` | 16/16 | 100.0% |
| `02-light-mid-12de16.svg` | 12/16 | 75.0% |
| `03-mid-high-10de16.svg` | 10/16 | 62.5% |
| `04-midtones-08de16.svg` | 8/16 | 50.0% |
| `05-mid-low-05de16.svg` | 5/16 | 31.3% |
| `06-dark-mid-03de16.svg` | 3/16 | 18.8% |
| `07-shadows-01de16.svg` | 1/16 | 6.3% |

The fill **order** is the whole trick: cells are added following a Bayer 4×4
threshold matrix, so every level stays dispersed and optically centred. Fill
them in a clustered order instead and you get a shrinking blob — which is what
`blocks/` already is.

Sub-grid size matters more than it looks. A 3×3 only has three symmetric levels
(1, 5 and 9 cells) and you need seven, so its midtones come out lopsided and
push a false direction across the image. 4×4 has enough levels to stay balanced
at every step.

Want a true 100% empty as well? Switch state 7 off.

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
