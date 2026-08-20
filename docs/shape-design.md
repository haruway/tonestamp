**English** · [Português](shape-design.pt-BR.md)

# The reasoning behind the shapes

This is the part nobody explains, and it is what separates a good result from a smudge.

If you only want to know what each control does, that is the [manual](manual.md).

---

## The principle: optical weight, not drawing

Each cell has exactly one job: **to represent a quantity of light.** The eye does not read the individual shape of a cell, it reads the **amount of ink** that cell deposits in that area. That is called optical weight, or density.

So there is only one rule:

> **The order of the seven states has to be a monotonic ramp of filled area.**

If state 3 carries less ink than state 4, the image breaks. The face disappears, a false relief shows up, and the reading turns to noise. It is mistake number one.

It is also easy to make by accident. The original set shipped with two inversions — a rounded square at 68.9% sitting above a circle at 66.5%, and a diamond at 42.3% sitting above a circle at 36.3%. Both are fixed now, and `node scripts/check-ramp.mjs` measures the set geometrically and fails the build if the ramp ever climbs again.

## How to judge a shape's weight

You do not need maths. Do the squint test: put the seven shapes side by side, narrow your eyes until they blur, and they have to become a clean gradient from white to black. If one jumps out of order, move it or redraw it.

The scale of the bundled set, measured as approximate filled area:

| State | Shape | Filled area |
|---|---|---|
| 1 · Highlights | Circle r=46 | 66.5% |
| 2 · Light mid | Rounded square 80×80 | 62.5% |
| 3 · Mid high | Circle r=34 | 36.3% |
| 4 · Midtones | Diamond, 80 diagonals | 32.0% |
| 5 · Mid low | Ring (r=38, hole r=22) | 30.2% |
| 6 · Dark mid | Square 28×28 | 7.8% |
| 7 · Shadows | Dot r=7 | 1.5% |

Note that it is not a perfectly linear percentage ramp. **Area is not the same thing as perceived weight.** A shape with a hole in it (the ring) reads lighter than its area suggests, because the hole creates a breath the eye registers as light. That is why it sits at state 5 and not at state 3.

Note too that the steps are uneven — a 26-point drop between states 2 and 3, then three states within 6 points of each other. That is inherited from the original set. It is monotonic, so it works, but a set with more evenly distributed steps will give you smoother midtones.

## Why each shape family suits a zone

**Solid convex shapes at the extremes.** Full circle, square, disc. In the highlights you want continuous mass, because neighbouring cells will almost touch and form a surface. In the shadows you want the opposite, an isolated dot the eye nearly loses.

**Shapes with a hole in the midtones.** Ring, square with a hole, target. This is the move that gives the Makoto San posters their sense of depth. The hole creates a second reading scale inside the cell: from far away it is a mid tone, up close it is a graphic object. It is what makes a poster work both in the feed and printed at a metre away.

**Asymmetric shapes only if you are going to use rotation.** A triangle or an arrow in a fixed grid creates false direction, and the eye sees diagonal stripes that are not in the photo. With 90° snap on, that direction breaks up and becomes texture. Without rotation, avoid.

**Thin, linear shapes are treacherous.** A bar or a stroke has low area but high edge contrast, so it reads darker than its area says. If you use a stroke, place it one or two states lighter than the area calculation suggests.

## Three scale strategies that work

**1. Scale by size (the safest).** One shape, seven sizes. Circle r=46, 38, 30, 22, 16, 10, 5. This is classic newspaper halftone. It never goes wrong, the result is clean, and the photographic reading is perfect. Start here when testing a new photo.
→ preset [`retrato-editorial.json`](../examples/retrato-editorial.json)

**2. Scale by density (the most graphic).** Seven different shapes with decreasing weight, like the bundled set. It gives personality and it is where brand identity enters. This is what Anton did with the Makoto San shapes.
→ preset [`poster-serigrafia.json`](../examples/poster-serigrafia.json)

**3. Scale by complexity (the most editorial).** From most complex to simplest, keeping the area similar. Highlight = a shape with three nested elements, shadow = a plain dot. It creates a reading of "resolution" instead of a reading of "tone", and it works very well for lettering and large type. This is what produced the MAKOTO SAN grid titles at the end of the reel.
→ preset [`lettering.json`](../examples/lettering.json)

## Building your own set

Practical Illustrator workflow:

1. Square 100×100px artboard. **Always square**, because the tool fits the shape into a square cell and centres it. A shape on a rectangular artboard will come out distorted or with the wrong padding.
2. Draw it centred, leaving a safety margin of 4 to 8% at the edges. A shape touching the edge sticks to its neighbour and closes the image up.
3. One colour only, and expand all strokes. An unexpanded stroke can come out at the wrong weight, because the tool scales the shape.
4. Join everything into a compound path when there is a hole, otherwise the hole comes out filled.
5. Save as SVG. In *Export for screens* or *Save as SVG*, pick **SVG 1.1 profile**, CSS properties as **presentation attributes**, and uncheck **Preserve Illustrator editing capabilities** (that is what leaves the file with 40KB of junk).
6. Test the whole set in the tool on a face you know well. A face is the hardest test, because any ramp error shows up on the cheek immediately.

A shortcut that works well: take an element from the brand identity — the counter of a letter, a detail of the symbol, a form from the graphic pattern — and generate the seven variations by **subtracting mass progressively** instead of drawing seven different things. The result is cohesive and the brand shows up in the texture without needing a logo.

## Checklist before closing a set

- [ ] All seven artboards are square and the same size.
- [ ] The squint test gives a clean gradient, with no inverted step.
- [ ] Nothing touches the artboard edge.
- [ ] Strokes expanded, holes as compound paths.
- [ ] One colour per file, unless you plan to switch *Fill solid* off deliberately.
- [ ] Tested on a face, not just on a gradient.
- [ ] Saved as a preset, so you do not lose the set.
- [ ] If it is going into `shapes/`, `node scripts/check-ramp.mjs` passes.
