**English** · [Português](CHANGELOG.pt-BR.md)

# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Semantic versioning.

## [1.0.0] — 2026-08-19

First public release. A single-file prototype became a repository, without
changing the behaviour of any existing control.

### Added

- **Theme system.** Dark (default) and light, toggled from the panel header,
  persisted in `localStorage` under `tonestamp:theme`. On a first visit it
  follows `prefers-color-scheme`. 150ms transition, respecting
  `prefers-reduced-motion`. The theme belongs to the interface and never
  touches the composition's background colour.
- **Portuguese and English interface**, toggled from the header and persisted
  under `tonestamp:lang`, defaulting to the browser language. Modules that do
  not know the DOM return error *keys* rather than sentences, so they stay
  language-agnostic.
- **Presets.** Save and load the whole configuration as `.json`, with the SVGs
  embedded as text so the file is portable. A `version` field allows future
  migration. Invalid, corrupt or newer-version JSON is refused with the reason
  on screen, never a blank page.
- **Four example presets** in `examples/`, one per combination documented in
  the manual: editorial portrait, screen-print poster, lettering and background
  texture.
- **Embedded typefaces.** Bricolage Grotesque and IBM Plex Mono ship as base64
  inside the single file. The tool now makes **no network request at all** —
  previously it claimed to run offline while fetching fonts from Google.
- **Visible error states.** An SVG that fails to open now shows the reason on
  its state card, with a highlighted border. It used to fail silently and the
  shape would simply disappear. Source errors (corrupt file, unsupported
  format) appear in the Source section.
- **Specific webcam messages** per failure type: permission denied, no camera,
  camera busy.
- **Performance warning** at the bottom of the preview when the grid goes above
  160 with a moving source.
- **Single-file build.** `node scripts/build.mjs` inlines the CSS, base64-embeds
  the fonts and resolves the ES module graph into a self-contained
  `dist/index.html`. Plain Node, zero dependencies. `--check` fails if `dist/`
  is stale.
- **Contrast checker.** `node scripts/contrast.mjs` reads both themes' tokens
  and checks the pairs the interface actually renders against the AA minimum.
- **Tonal ramp checker.** `node scripts/check-ramp.mjs` measures the filled area
  of every default shape geometrically and fails if the ramp ever climbs. It
  also verifies the files in `shapes/default/` still match the `DEFAULT_SVG`
  constant in the code.
- **Automatic deploy** to GitHub Pages on every push to `main`, verifying that
  the committed `dist/` matches what the build produces.
- Documentation in **both languages**: readme, manual, shape design guide,
  contributing guide, and a shot list of the images still missing.
- `NOTICE.md`, stating what the project is and asking that the tool itself not
  be resold — a request, deliberately not a licence restriction.

### Changed

- **Source modularised.** The single HTML file became `src/` with ten ES
  modules: `state`, `shapes`, `palette`, `renderer`, `export`, `sources`,
  `presets`, `i18n`, `theme` and `main`. `renderer`, `palette` and `shapes` do
  not touch the page DOM beyond the canvas they receive as a parameter.
- **CSS split** into `fonts.css`, `tokens.css`, `base.css` and
  `components.css`, with every interface colour as a custom property.
- **Larger typography.** Wordmark 19 → 27px, section headings 10 → 12.5px,
  field labels 9.5 → 10.5px, highlighted values 10.5 → 12.5px, state names
  10.5 → 12.5px. Letter-spacing comes down to compensate, and the panel widens
  from 372 to 392px.
- Source buttons that were styled `<label>` elements became real `<button>`s,
  so they work from the keyboard.
- Palette swatches became `<button>`s with `aria-label`.
- Palette extraction now receives the source as a parameter instead of reading
  global state.

### Fixed

- **The default shape set was not a monotonic ramp.** Two inversions: the
  rounded square at 68.9% sat above the state-1 circle at 66.5%, and the
  diamond at 42.3% sat above the state-3 circle at 36.3%. Both produced false
  relief — a tonal step that is not in the photograph, most visible on skin.
  The square is now 80×80 rx13 (62.5%) and the diamond has 80 diagonals
  (32.0%). The manual claimed the diamond was "~21%"; the arithmetic was wrong,
  a diamond with 92 diagonals is (92×92)/2 = 4232, or 42%.
- **Accessibility.** Every control has a label or an `aria-label`; the `↑` and
  `●` buttons on each state announce which state they belong to; visible focus
  on everything focusable; `aria-pressed` on toggle buttons.
- **Layout at 390px.** New breakpoint at 480px adjusting padding, letter-spacing
  and the state card grid. The panel header stops being sticky below 900px,
  where it was covering content.
- **Resource cleanup.** `URL.revokeObjectURL` after the image decodes and when
  the source changes; webcam stream stopped on source change;
  `requestAnimationFrame` cancelled when the tab is hidden, via
  `visibilitychange`; everything released on `pagehide`.
- **Invalid SVG** is now detected at parse time — `parsererror`, non-`<svg>`
  root, empty file — instead of relying on the `Image` `onerror` path.
- The same file can be uploaded twice in a row: the input value is cleared
  after each read.

### Deliberately kept

- The 1200-entry ceiling on the tint cache, clearing wholesale rather than LRU.
- Colour quantisation in steps of 32 per channel in Pixel and Quantize modes.
- All tone mapping, geometry, scale and rotation maths, byte for byte identical
  to the prototype.

### Known waivers

- Three contrast pairs in the dark theme fall below AA: secondary text on a
  state card (4.34:1), white on the record button (3.38:1) and the divider
  border (1.28:1). These are values from the original prototype palette, fixed
  by the brief. They are registered as waivers in `scripts/contrast.mjs` and
  appear in every report.
- The default ramp is monotonic but unevenly distributed — a 26-point drop
  between states 2 and 3, then three states within 6 points of each other.
  Inherited from the original set.
- The readme still has no demo GIF. The shot list is in
  `docs/assets/README.md`.
- Safari has not been tested interactively. WebM recording is known not to work
  there; everything else is a static API audit.

[1.0.0]: https://github.com/haruway/tonestamp/releases/tag/v1.0.0
