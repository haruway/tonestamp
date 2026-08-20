**English** · [Português](CONTRIBUTING.pt-BR.md)

# Contributing

Thanks for looking. This is a small project with a strong opinion about what it is, so the constraints are worth reading before you write code.

## The one constraint that matters

**Zero runtime dependencies. Vanilla JS with ES modules.**

That is a product decision, not a limitation we are waiting to outgrow. The thing being offered is a file you download and double-click, that still works in five years with no toolchain. A framework, a CDN script, or a bundler in the critical path breaks that promise.

Please do not open a PR that adds React, Vue, Svelte, Tailwind, a state manager, a plugin system, an i18n layer, a service worker, analytics, or a backend. It will be declined, and that is not a judgement on the code.

## Setup

```bash
git clone https://github.com/haruway/tonestamp.git
cd tonestamp

npm run serve      # http://localhost:8080 — required, see below
npm run build      # regenerate dist/index.html
npm run check      # verify dist/ matches src/
npm run contrast   # WCAG report for both themes
```

There is no `npm install`. `package.json` exists for the scripts and metadata; there are no dependencies to fetch.

**You cannot open `src/index.html` from `file://`.** Browsers block ES modules over that protocol. Use `npm run serve` while developing, or test the built `dist/index.html`, which is a single file with everything inlined and works fine from disk.

## Architecture

```
src/js/
  state.js      S, slots, palette + get/set/subscribe    no DOM at all
  shapes.js     parse, rasterise, tint, tint cache       no page DOM
  palette.js    k-means, colour maths, per-cell colour   no page DOM
  renderer.js   sampling, tone mapping, draw loop        canvas param only
  export.js     PNG, vector SVG, WebM recording
  sources.js    file, video, webcam, drag and drop
  presets.js    JSON save/load with validation
  theme.js      dark/light toggle
  main.js       boot, DOM wiring, everything with an id
```

Two rules hold this together:

1. **`renderer.js`, `palette.js` and `shapes.js` must not touch the page DOM.** They may create canvases and images in memory, and they may draw on a canvas handed to them as a parameter. They may not call `getElementById`. This is what makes them testable and reusable outside the tool.
2. **Only `main.js` knows the HTML ids.** If you find yourself reaching for an element from any other module, expose a callback instead — `renderer.onStats`, `sources.onChange`, `sources.onError` are the existing pattern.

The module graph is acyclic and the build depends on that. `state.js → shapes.js` is the only import into a leaf; `renderer` and `export` sit on top.

## The build script

`scripts/build.mjs` is a deliberately small bundler: it inlines the CSS, walks the module graph from `main.js`, strips `import`/`export`, and wraps each module in an IIFE that registers into a `__m` object.

It supports a **narrow, explicit subset** of module syntax and errors loudly on anything else:

| Supported | Rejected, with a message telling you why |
|---|---|
| `import { a, b } from './x.js'` | `import def from …` |
| `import * as ns from './x.js'` | `import(…)` dynamic |
| `export function` / `async function` | `export default` |
| `export const` / `export class` | `export let` / `export var` |
| `export { a, b }` | package imports, circular dependencies |

`export let` is rejected because ES modules give you a live binding and the bundle copies the value at import time — the two would behave differently. Expose a getter instead, the way `state.js` does with `getPalette()`.

The script also verifies that every named import actually exists in the target module's exports. ESM would throw a `SyntaxError`; the bundle would silently produce `undefined`, so the check has to happen at build time.

If you touch `src/`, **run `node scripts/build.mjs` and commit `dist/index.html` in the same commit.** CI fails the build otherwise, on purpose — a stale `dist/` means someone downloads a file that does not match the source.

## Behaviour is frozen

The visual output of every existing control is settled. Refactors are welcome; changing what a slider does to the image is not, unless it is fixing a clear bug.

Two things in particular look like inefficiencies and are not:

- **The tint cache clears wholesale at 1200 entries** instead of evicting LRU. Clearing is cheaper and more predictable, and the cost is one slow frame occasionally.
- **Pixel-mode colours are rounded to steps of 32 per channel.** Without it, a colour photo requests a near-unique tint per cell and the cache becomes a memory leak. Nine levels per channel, 729 combinations per shape. Do not remove this without measuring memory on a colour photo in Pixel mode.

Both are documented in the manual and commented in the source.

## Accessibility

Every control needs an associated `<label>` or an `aria-label`. Focus must stay visible. The state row buttons (`↑`, `●`) are single characters, so their `aria-label` has to name the state they belong to.

`npm run contrast` reads the theme tokens and checks the pairs the UI actually renders. It exits non-zero on a failure that is not explicitly waived. If you add a colour token, add its pair to the table in `scripts/contrast.mjs`.

The dark theme carries three documented waivers, inherited from the original prototype palette. Do not add new ones without a reason written into the waiver.

## Commits

Conventional commits, one logical unit each:

```
feat:      new capability
fix:       bug fix
refactor:  no behaviour change
docs:      documentation only
chore:     tooling, config, housekeeping
ci:        workflow changes
build:     build script changes
```

Explain *why* in the body when the change is not self-evident. The what is in the diff already.

## Shape sets

New shape sets are welcome as a sibling folder to `shapes/default/`. Read [docs/shape-design.md](docs/shape-design.md) first — a set whose filled area is not a monotonic ramp will be sent back, because it does not work, not because of taste.

Include a short `README.md` with the ramp and one example render.
