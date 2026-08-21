**English** · [Português](README.pt-BR.md)

# Readme images — what exists and what is missing

The images are ranked by how much they earn their place. If you only ever make
one of the missing ones, make **#1**.

## Status

| # | File | Status | Impact |
|---|---|---|---|
| 1 | `demo.gif` | ❌ **missing** | 🔥🔥🔥 the single highest-impact asset |
| 2 | `hero-still.png` | ❌ missing | 🔥🔥🔥 |
| 3 | `modes-*.png` | ❌ missing | 🔥🔥 |
| 4 | `ui-dark-{en,pt}.png` | ✅ generated | 🔥🔥 |
| 5 | `shape-ramp-{en,pt}.png` | ✅ generated | 🔥🔥 |
| 6 | `ui-light-{en,pt}.png` | ✅ generated | 🔥 |
| 7 | `svg-illustrator.png` | ❌ missing | 🔥 |

Items 4, 5 and 6 were rendered straight from the repository with headless
Chrome and are already wired into the readme. The missing ones all need a real
photograph and a human hand on the sliders, which is why they are yours.

---

## 1 · `demo.gif` — top of the readme · **do this one first**

Nothing else communicates what this tool is in under three seconds. A static
image shows the output; only the GIF shows the *transformation*, and the
transformation is the product.

| | |
|---|---|
| Format | GIF (recorded as .mov, converted) |
| Duration | **15s maximum** |
| Weight | **under 5MB** — GitHub will not load a heavy GIF on mobile |
| Size | around 1200×750 |
| Goes | uncomment the line just below the badges in `README.md` and `README.pt-BR.md` |

**Script, in order:**

1. **(0–2s)** Still frame, a face already loaded, grid around 90, black and white. Let the eye register that it is a portrait.
2. **(2–7s)** **Drag the Grid resolution slider** from 90 down to ~25 and back up to ~110. This is the most legible movement the tool has — it explains the whole concept without a caption.
3. **(7–11s)** Click **Quantize** and push **Saturation** to +70. The image becomes a colour poster in front of the viewer.
4. **(11–15s)** Enable **Scale shapes with midtones** and move Max size. End on a still, good-looking frame.

Do not touch anything else. A GIF with six things happening communicates none
of them.

**Recording.** The tool has a **Record WebM** button, but it captures only the
canvas, with no panel. For the top-of-readme GIF you want the sliders visible,
so use the system recorder:

- **⌘⇧5** → Options → turn on **Show Mouse Clicks** → record the browser window.
- Resize the browser to about 1440×900 first. Fullscreen on a large display makes the UI tiny in the GIF.
- Turn on Do Not Disturb. A notification mid-take ruins it.

**Converting:**

```bash
brew install gifski
gifski --fps 12 --width 1200 --quality 80 -o demo.gif recording.mov
# over 5MB? drop to --fps 10 or --width 1000
```

## 2 · `hero-still.png` — the frame that sells it

One beautiful result, no interface at all. This is the image people screenshot
and repost, and it is the fallback if the GIF ends up too heavy.

- Export **PNG** from the tool at 2040px.
- Preset `retrato-editorial.json` on a face with good contrast.
- Background `#0D0D0D`, white shapes.

## 3 · The three colour modes — the comparison

Three images side by side explain in two seconds what the Features paragraph
explains in fifty words.

| File | Configuration |
|---|---|
| `mode-state.png` | **State** mode, white shapes, black background |
| `mode-pixel.png` | **Pixel** mode, saturation 0 |
| `mode-quant.png` | **Quantize** mode, 3-colour palette, saturation +70 |

**Same photo, same grid, same framing in all three.** If the photo changes
between them the comparison is worthless. Export PNG at 1000px for each,
changing only the mode.

## 4 · `ui-dark-en.png` / `ui-dark-pt.png` ✅ done

The full interface, dark theme, running the built-in test gradient. Sits right
under the badges as the first thing on the page.

**Two versions, one per language.** `README.md` shows the English capture and
`README.pt-BR.md` the Portuguese one — a reader should never land on a page in
their language and see a screenshot in another.

Regenerate after a layout change:

```bash
node scripts/build.mjs
# then render dist/index.html at 1440×900 with a 2x device scale factor
```

## 5 · `shape-ramp-en.png` / `shape-ramp-pt.png` ✅ done

The seven default shapes in a row with their filled-area percentages, and the
same row heavily blurred underneath.

This is the best single explanation of the core idea, because the blurred row
*is* the squint test — you can see it resolve into a clean gradient. It carries
the "monotonic ramp" argument better than any paragraph.

## 6 · `ui-light-en.png` / `ui-light-pt.png` ✅ done

The interface in the light theme, English, with the composition background
still black.

That last detail is the whole point of the image: it proves the claim the
manual keeps making, that the interface theme and the composition background
are independent. Keep `Background color` at `#000000` in any regeneration.

## 7 · `svg-illustrator.png` — proof of the vector

A screenshot of Illustrator with an exported SVG open, layers expanded, showing
the `<use>` elements as editable objects with one selected.

This is the screenshot that convinces designers. "Exports real vector" is easy
to write and easy to doubt; the capture settles it.

---

## Publishing checklist

- [ ] `demo.gif` under 5MB, checked in the GitHub preview
- [ ] GIF line uncommented in **both** `README.md` and `README.pt-BR.md`
- [ ] Every PNG run through `pngquant` or `oxipng`
- [ ] No third-party photo without usage rights — if it is stock, credit it; your own is better
- [ ] **No Makoto San artwork** in any capture: this repo credits the technique, it does not redistribute the work
- [ ] Live GitHub Pages link tested after the first deploy
