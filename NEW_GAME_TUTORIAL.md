# Reshaping the machine

How to turn this 3×3 into any other shape — a 5×4, say — without touching
component code. The machine is data, art, and a handful of measured numbers.

## 1. The maths — `src/config/game.definition.ts`

- One strip per column: five strips for five reels. How often a symbol
  appears on a strip is its weighting.
- `rows` — how many rows the window shows: `4`.
- `lines` — one row index per column: `[1, 1, 1, 1, 1]` is the middle row
  across five reels.
- `payouts` — `full` per symbol, `partial` per run length. Retune for the
  new odds.
- Verify with `pnpm sim` — it spins the definition headlessly and reads back
  the return.

## 2. The symbols — `assets/sprites{tps}/symbols/`

- One png per paytable key (`H1.png` …), all the same size.
- Symbol size sets the grid: a reel is as wide as its symbol, a row as tall.

## 3. The size to draw

- Grid: `columns × symbolWidth + (columns − 1) × reelGap` wide,
  `rows × symbolHeight` tall. A 5×4 of 120px symbols with a 30px gap
  is 720 × 480.
- The window the grid asks for: grid width + `2 × windowOverhang`,
  grid height − `2 × windowCrop` — here 737 × 381.
- Draw the cabinet with its window at that native size and the art renders
  1:1, no stretch.

## 4. The art — `assets/sprites{tps}/`

- `reels.png` — the cabinet. Its window must be horizontally centred;
  vertically it can sit anywhere.
- `mask.png` — the window's silhouette alone, at any resolution: it is
  stretched onto the window by its own size and owes the cabinet nothing.

## 5. The measurements — `src/config/visual.settings.ts`

- `cabinetWindow: { offset, width, height }` — the window as the cabinet art
  draws it: its middle this far below the art's own, and this big, all in art
  pixels. Measured once, in the image editor.
- `windowOverhang` / `windowCrop` — retune by eye: out past the outside
  columns so nothing clips, in over the top and bottom rows so the strip
  reads as running past the window.
- `reelGap` — if the spacing changes.

## 6. The wiring

- Nothing to pass: `SlotMachine` builds itself from the `reels` and `mask`
  atlas frames and the `cabinetWindow` measurements. Ship the new art under
  the same names, or point `Sprite.from` in `SlotMachine.ts` at new ones.
- Every piece places itself. If the footprint grew, nudge the hand-tuned
  `marginTop`s in `SpinPannel`, `BetPannel`, `WinPannel` and `Win.layout`,
  and the `minWidth`/`minHeight` in `Root.layout.ts`.

## What never changes

`SlotMachine`, `Reels`, `Reel`, `Symbol`, the engine, and the win
presentation are generic over columns and rows — a new shape is data and
art, not code.
