**English** · [Português](manual.pt-BR.md)

# Tonestamp — the manual

Tonal halftone in seven states. One HTML file, runs offline in the browser, no install and no server. Open it by double-clicking.

Based on the technique [Anton Burmistrov (@antoncreations)](https://www.instagram.com/antoncreations/) demonstrated in a reel on 18 May 2026, with a few additions.

> This is the usage manual. To understand **how to design a shape set that actually works**, read [shape-design.md](shape-design.md) — that is the part that separates a portrait from a smudge.

---

## The concept in one sentence

The tool reads the **brightness** of each grid cell and swaps that cell for an **SVG** chosen according to the brightness band it fell into. It is not pixel art and it is not ASCII. It is halftone with a custom shape.

That is why there are seven states: the image is built from **luminance**, not colour. Colour is a separate axis you stack on top (see the Colour section).

---

## Source

| Control | What it does |
|---|---|
| **Image** | Opens the file picker. Accepts JPG, PNG, WebP, static GIF. |
| **Video** | Accepts MP4, WebM, MOV. Loops, muted, and the filter runs live frame by frame. |
| **Webcam** | Asks for camera permission and uses it as a live source. Good for testing a shape quickly, and good for installations. |
| **Ratio** | Toggles between `original` (keeps the framing) and `1×1` (centre-crops to a square). |
| **Pause / Play** | Freezes video or webcam without losing the current frame. Use it before exporting PNG or SVG to lock exactly the frame you want. |

You can also **drag and drop** a file onto the preview area.

If something fails to load — corrupt file, denied camera, a format the browser will not open — the message appears right below the Source buttons, with the reason.

---

## Grid

| Control | Range | What it does |
|---|---|---|
| **Grid resolution (scale)** | 8 to 220 | How many columns of cells. Low = few large cells, abstract reading. High = many small cells, the original image becomes recognisable again. The row count is derived automatically to keep the aspect ratio. |
| **Background color** | any | The colour behind the shapes. It also acts as the "empty" colour wherever a state is switched off. |
| **Fill SVG shapes (solid)** | on/off | **On:** ignores the SVG's own colours and paints the whole shape in the state colour. This is the normal mode. **Off:** draws the SVG with the colours it already has. Useful if you deliberately drew a multicolour icon. |
| **Quick invert mapping** | on/off | Flips the entire scale. What was highlight becomes shadow. Turns it into a negative, useful for testing a composition on a light background. |

**About grid resolution.** The sweet spot for a portrait is usually between 60 and 110. Below 40 you lose the face and gain a pattern. Above 140 it turns into noise and the point of the halftone disappears.

> ⚠️ With a moving source and a grid above 160, a warning appears at the bottom of the preview. That is not a bug: it is tens of thousands of draw calls per frame and the frame rate genuinely drops.

---

## 7-state midtone mapping

Seven rows, highlight to shadow:

| State | Brightness band | Usually gets |
|---|---|---|
| 1 · Highlights | lightest | the heaviest shape / most area |
| 2 · Light mid | | |
| 3 · Mid high | | |
| 4 · Midtones | middle | a transition shape |
| 5 · Mid low | | |
| 6 · Dark mid | | |
| 7 · Shadows (100%) | darkest | the lightest shape / least area, or nothing |

Each row has three controls:

- **Colour swatch** on the left: the colour for that band. Only has an effect in the `State` colour mode.
- **↑** : upload your own SVG to that band. Turns green when it holds a custom file.
- **●** : switches the state on and off. Off, that tonal band is left **empty**, showing only the background. This is how you open holes and let the image breathe.

The small dark square beside it previews the shape already tinted in the chosen colour, against the chosen background.

If an SVG you upload will not open, the card gets a pink border and shows the reason — malformed XML, root element that is not `<svg>`, empty file. This used to fail silently and the shape would just disappear.

**All white** resets the seven colours to `#FFFFFF`.
**Default shapes** restores the bundled set and switches every state back on.

---

## Colour

Three mutually exclusive modes.

| Mode | Where the cell colour comes from |
|---|---|
| **State** | The fixed colour you chose for that tonal band. Classic behaviour. |
| **Pixel** | The real colour at that point of the original image. The shape still comes from brightness. More photographic, dirtier result. |
| **Quantize** | The nearest colour inside a palette extracted from the image. This is what produces the flat screen-printed poster look. |

Supporting controls:

- **Palette colours (2 to 8):** how many colours the algorithm extracts. Three or four gives you the screen-print look. Eight is almost photographic.
- **Extract and apply:** runs k-means, fills the swatches **and** spreads the palette across the seven states in one go. Clicking a swatch copies its hex.
- **Apply to states:** pushes the extracted palette into the seven colour pickers, spread light to dark, interpolating when the palette has fewer than seven colours. This is the "automatic settings by colour".
- **Extract on source change:** re-runs extraction every time you load a new image.
- **Saturation (-100 to +100):** only affects Pixel and Quantize. Push it to +60 or +80 to flatten the colours and escape the washed-out look.

**How the k-means works here:** it downsamples the image to 96×96, treats each pixel as a point in RGB, and clusters it into N groups over 12 iterations. Each cluster centre becomes a palette colour. The palette is then sorted by luminance, lightest to darkest, which is why *Apply to states* already lands coherently on the tonal scale.

The initial centroids are picked spread across the image scan, not at random. That is deliberate: with a random seed the palette changed on every click for the same file, which is unhelpful when you are closing a poster.

---

## Scale and rotation

| Control | What it does |
|---|---|
| **Scale shapes with midtones** | Enables size variation **within** each band. A cell at the top of band 3 renders larger than one at the bottom of band 3. This softens the hard edges between states. |
| **Min size (%)** | Smallest size, at the bottom of the band. |
| **Max size (%)** | Largest size, at the top. Can exceed 100% so shapes overlap and close into solid areas. |
| **Enable 90° snap rotation** | Each cell rotates in multiples of 90°, drawn from a stable per-position seed. Only makes a visual difference with asymmetric shapes. |
| **Rotation interval** | Milliseconds between turns. Lower is faster. Only meaningful with video or webcam, or for recording WebM. |

**Worth knowing:** with *Scale* off but *Max size* different from 100%, every shape sits at the same fixed size defined by Max. That is how you open uniform spacing in the grid.

---

## Tone

These three act **before** the mapping — they change which state each cell lands in. They are not a visual effect, they are distribution control.

| Control | What it does |
|---|---|
| **Brightness** | Pushes the whole image up or down the scale. Positive = more cells land in the light states. |
| **Contrast** | Pushes the ends away from the middle. Increases separation between highlight and shadow, reduces use of the middle states. |
| **Gamma** | Redistributes only the midtones, leaving the ends alone. Below 1.00 darkens the mids, above lightens them. The most precise of the three — reach for it before resorting to contrast. |

If your image is only using three of the seven states, that is a tonal distribution problem, not a shape problem. Start here.

---

## Export

| Control | What it does |
|---|---|
| **Output resolution** | 600 to 3000px on the long edge. Does not change the grid, changes how many pixels each cell occupies. |
| **Transparent background** | Drops the background from PNG and SVG export, so you get shapes on alpha. The preview keeps showing the background colour — otherwise you would be staring at the browser's checkerboard while you work. |
| **PNG** | Downloads the current frame as a PNG. |
| **SVG** | Downloads **real vector**. Emits one `<g>` per shape-and-colour pair inside `<defs>`, and one `<use>` per cell positioned by `transform`. Opens in Illustrator fully editable. |
| **Record WebM** | Records the preview area to video at 30fps. Click again to stop and download. Use it for filtered video, animated rotation and webcam. |

**Why `<g>` and not `<symbol>`.** Illustrator reads SVG 1.1 and handles `<symbol>` with a viewBox inconsistently, and it ignores the SVG 2 `href` attribute entirely — it needs `xlink:href`. Earlier exports opened correctly in macOS Preview and as an empty black rectangle in Illustrator, which is exactly that combination. The export now writes both attributes and positions plain groups with `transform`.

**About SVG weight.** In `State` or `Quantize` mode the file is light, because there are few shape-colour combinations. In `Pixel` mode it can become hundreds of groups and the file gets heavy. If you are exporting vector, prefer Quantize.

---

## Presets

Saves and reloads **the entire configuration** as a `.json`.

| Control | What it does |
|---|---|
| **Save preset** | Downloads a JSON with every parameter, the seven colours, which states are on, and the SVGs **embedded as text**. |
| **Load preset** | Reads a `.json` and restores everything, custom shapes included. |

The SVGs are embedded deliberately: a preset has to travel between machines, over email and on a USB stick without dragging an assets folder along.

The file carries a `version` field. If you open a preset written by a newer build, the tool refuses with a message instead of applying half of it. A corrupt preset, some other JSON, or a missing state is refused the same way, with the reason printed on screen — never a blank page.

There are four ready-made examples in [`examples/`](../examples/), one per combination documented at the end of this manual.

---

## Interface theme

Button in the top right of the panel. Two themes, dark (default) and light. The choice is stored in `localStorage` under `tonestamp:theme`. On a first visit the tool follows the operating system preference.

**The theme is only the interface.** It does not touch the grid's *Background color*. That is a composition decision, it is yours, and it stays put when you switch themes — working with a light interface and a black composition background is a perfectly normal thing to do.

---

## Language

Button next to the theme toggle. Portuguese and English. Stored in `localStorage` under `tonestamp:lang`; on a first visit it follows the browser language.

In Portuguese mode the technical control names stay in English — `Grid resolution`, `Fill SVG shapes`, `Scale shapes with midtones` — because that is how Brazilian designers actually say them, and it matches the original tool.

---

## Accessibility

- Every control has an associated label or an `aria-label`. The `↑` and `●` buttons on each state announce which state they belong to.
- Visible focus on everything focusable, outlined in the accent colour.
- The whole panel is keyboard navigable, in visual order.
- The light theme meets AA (4.5:1) for text. `node scripts/contrast.mjs` runs the checker and prints the report, including the known waivers on the dark theme.
- `prefers-reduced-motion` disables the theme transition.

---

## Combinations that are known to work

Each one has a ready preset in [`examples/`](../examples/).

**Black and white editorial portrait** — `retrato-editorial.json`
Grid 90, size-scale with circles, background `#0D0D0D`, all shapes white, scale on with min 15 and max 105, gamma 0.85.

**Colour screen-printed poster** — `poster-serigrafia.json`
Grid 55, Quantize mode with a 3-colour palette, saturation +70, solid flat shapes, scale off with max at 92 to open the grid. Background set to the darkest colour in the palette.

**Lettering / title** — `lettering.json`
Grid 34, complexity-scale, state 7 switched off so shadows become empty, 90° rotation on with a long interval. Export to SVG and take it into Illustrator to adjust cells by hand.

**Background texture for a layout** — `textura-fundo.json`
Grid 160, one single shape repeated across all states with only the colour changing, low saturation. Becomes a fine noise pattern you can put behind type.

---

## Known limitations

- Above 160 columns with moving video, the frame rate drops. It is tens of thousands of draw calls per frame. For a still image it is not a problem at all.
- In Pixel mode colours are rounded to steps of 32 per channel, to keep the tinted-shape cache under control. In practice you cannot see it, because the image is already heavily abstracted.
- The webcam needs HTTPS or `localhost` in some browsers. Opening the file straight from disk, Chrome usually allows it, Safari sometimes does not.
- WebM recording does not work in Safari. Use Chrome or Firefox.
- A multicolour SVG with a gradient will not work well with *Fill solid* on, because the fill overwrites everything. Turn fill off in that case.
- Running `src/index.html` straight from disk does not work: browsers block ES modules over `file://`. Use `dist/index.html`, or serve `src/` over HTTP (`npm run serve`).
