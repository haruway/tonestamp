# SVG Dither

Tonal dithering that reads the luminance of each grid cell and replaces it with a custom SVG shape. One HTML file, no install, no server, no build step.

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-github%20pages-c8ff2e.svg)](https://danilomariani.github.io/svg-dither/)

<!--
  DEMO GIF GOES HERE — see docs/assets/README.md for the shot list.
  ![SVG Dither in action](docs/assets/demo.gif)
-->

**[Live demo →](https://danilomariani.github.io/svg-dither/)**

---

## What it does

The tool lays a grid over an image or video, reads the **brightness** of each cell, sorts it into one of **seven tonal bands** — highlight to shadow — and stamps the SVG shape assigned to that band.

This is not ASCII art and it is not pixel art. It is halftone with a shape you drew yourself.

Seven states exist because the image is built from **luminance**, not colour. Colour is an independent axis stacked on top, with three modes.

The whole thing depends on one rule: the seven shapes must form a **monotonic ramp of filled area**. Break the ramp and the face disappears. That reasoning is written up in [docs/shape-design.md](docs/shape-design.md).

## Quick start

1. Download [`dist/index.html`](dist/index.html).
2. Double-click it.

That is the whole thing. No npm, no server, no dependencies. It runs offline, straight off your disk. Drag an image onto the canvas and start moving sliders.

## Features

- **Seven-state tonal mapping.** Upload your own SVG per band, or use the bundled set. Turn a state off to leave that tonal band empty.
- **Three colour modes.** *State* — one fixed colour per band. *Pixel* — each cell samples the real colour at that point. *Quantize* — the pixel colour snaps to the nearest colour in a palette extracted from the image via k-means. Quantize is what gives you the flat screen-print look.
- **Tone controls before mapping.** Brightness, contrast and gamma change *which state a cell lands in*, not just how it looks. If your image is only using three of the seven states, that is a tonal distribution problem — fix it here.
- **Scale and rotation.** Vary shape size within a band to soften the edges between states, and snap-rotate cells by 90° to break false directionality in asymmetric shapes.
- **Real vector export.** SVG export emits one `<symbol>` per shape-colour pair and one `<use>` per cell. Opens in Illustrator fully editable — it is not a traced bitmap.
- **PNG and WebM export.** Still frames up to 3000px, or record the canvas at 30fps for animated and video sources.
- **Image, video and webcam sources**, with drag and drop.
- **Presets.** Save the entire configuration as JSON, shapes embedded as text so the file is portable. Four worked examples in [`examples/`](examples/).
- **Dark and light themes**, remembered across sessions, following your OS preference on first visit. The UI theme is fully independent of the composition's background colour.

## Bring your own shapes

Draw seven SVGs on square 100×100 artboards, single colour, strokes expanded, holes as compound paths. Upload each one with the `↑` button on its state.

The part that actually matters is *which* seven shapes. Optical weight is not the same as filled area — a ring reads lighter than its area suggests, because the hole registers as light. Getting the ramp right is the difference between a portrait and a smudge.

The full reasoning, the three scale strategies that work, and the Illustrator export settings are in **[docs/shape-design.md](docs/shape-design.md)**. The bundled set lives in [`shapes/default/`](shapes/default/).

## Documentation

| Document | Language | What it covers |
|---|---|---|
| [docs/manual.md](docs/manual.md) | Português | Every control, what it does, and known limitations. |
| [docs/shape-design.md](docs/shape-design.md) | Português | How to design a shape set that works. |
| [examples/README.md](examples/README.md) | Português | The four example presets and the JSON format. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | English | Setup, architecture, how to add a module. |

## Development

```bash
git clone https://github.com/danilomariani/svg-dither.git
cd svg-dither

npm run serve      # serve src/ at :8080 — ES modules need HTTP, not file://
npm run build      # inline src/ into dist/index.html
npm run check      # fail if dist/ is stale relative to src/
npm run contrast   # WCAG contrast report for both themes
```

Edit `src/`, never `dist/`. The build script is plain Node with **zero dependencies** — it inlines the stylesheets, walks the ES module graph from `src/js/main.js`, and concatenates everything into one file in topological order.

Source layout:

```
src/js/
  state.js      central state + tiny pub/sub          (no DOM)
  shapes.js     SVG parsing, rasterising, tint cache  (no page DOM)
  palette.js    k-means, colour maths, per-cell colour (no page DOM)
  renderer.js   sampling, tone mapping, the draw loop  (canvas only)
  export.js     PNG, vector SVG, WebM
  sources.js    file, video, webcam, drag and drop
  presets.js    save/load configuration as JSON
  theme.js      dark/light toggle
  main.js       boot and all DOM wiring
```

`renderer.js`, `palette.js` and `shapes.js` never touch the page DOM beyond a canvas passed in as a parameter. Keep it that way — it is what makes them testable and reusable.

`dist/index.html` is committed on purpose, so anyone can download and run it without a toolchain. CI fails if it drifts from `src/`.

## Browser support

| | Chrome | Firefox | Safari |
|---|---|---|---|
| Core rendering | ✅ | ✅ | ✅ |
| PNG / SVG export | ✅ | ✅ | ✅ |
| WebM recording | ✅ | ✅ | ❌ not implemented |
| Webcam from `file://` | usually allowed | usually allowed | often blocked — serve over https |

Fonts come from Google Fonts. Offline, the tool works identically and falls back to a system monospace.

## Credits

The technique comes from **[Anton Burmistrov (@antoncreations)](https://www.instagram.com/antoncreations/)**, who demonstrated it in a reel on 18 May 2026 with the Makoto San poster series. This project is an independent implementation of that idea with additional controls — the original insight is his.

Only the seven default shapes created for this project are included here. None of the original Makoto San artwork ships with this repository.

## License

MIT — see [LICENSE](LICENSE).
