**English** · [Português](README.pt-BR.md)

# Example presets

Four ready-made configurations, one for each combination documented in the
[manual](../docs/manual.md#combinations-that-are-known-to-work).

To use one: open the tool, **Presets** → **Load preset** → pick the `.json`. It
restores the parameters, the colours and the **shapes**, which travel embedded
inside the file.

| Preset | Grid | Colour mode | What it is |
|---|---|---|---|
| [`retrato-editorial.json`](retrato-editorial.json) | 90 | State | Scale by size: one circle at seven radii (46→5). Black and white, gamma 0.85, scale on. Classic newspaper halftone. Start here on a new photo. |
| [`poster-serigrafia.json`](poster-serigrafia.json) | 55 | Quantize | Seven solid shapes with no holes, 3-colour palette, saturation +70, max size 92% to open the grid. The flat screen-print look. |
| [`lettering.json`](lettering.json) | 34 | State | Scale by complexity: from three nested rings down to a dot. State 7 off, 90° rotation every 1600ms. For titles and large type. |
| [`blocos.json`](blocos.json) | 100 | State | Solid squares that touch at the highlight end and shrink into the shadows. Black on white, contrast +20, output 2040px. The hard printed-grid look. Uses the [`blocks`](../shapes/blocks/) set. |
| [`textura-fundo.json`](textura-fundo.json) | 160 | State | A single shape across all seven states, only the colour changes. Fine noise in desaturated warm tones, to sit behind type. |

Presets **do not store the image**. Load your source first, then the preset —
or the other way round, it makes no difference.

## Format

```jsonc
{
  "format": "tonestamp-preset",  // refused if it is anything else
  "version": 1,                  // refused if newer than the build understands
  "created": "2026-08-19T00:00:00.000Z",
  "params": { /* every field of S */ },
  "states": [ { "on": true, "color": "#ffffff", "name": "…", "svgText": "<svg …>" } ],
  "palette": [ [244, 233, 216] ]
}
```

Numeric values out of range are clamped to the nearest limit rather than
rejecting the whole file. `format`, `version` and the structure of the seven
states are mandatory — if any of those fail, the tool shows the reason and
applies nothing.
