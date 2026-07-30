# Game Rules

A 3x3 slot with a single payline.

## Grid

- 3 reels, 3 rows (`settings.reels`, `settings.rows`).
- Only the **middle row** participates in wins — one symbol per reel, 3 symbols total.
- The **top** and **bottom** rows are purely visual (they exist to show the reel strip). They never form or extend a win.

## Symbols

Five symbols, all equal in kind, no wilds or scatters:

`H1`, `H2`, `H3`, `H4`, `H5` (`settings.symbols`)

Each spin picks symbols independently and uniformly at random (see `src/utils/getRandomSymbol.ts`), so every symbol has the same 1-in-5 chance in every slot.

## Outcome

The spin is decided in full before a reel has moved, by `src/controllers/backend.controller.ts` — it stands in for the server. It rolls the whole 3x3 grid and works out what the payline pays; the reels only play that grid back. Each reel is handed its three symbols when it is asked to stop and lands on exactly those, so nothing about the result depends on the animation.

## Balance

- The player starts with `settings.balance` and every spin stakes `settings.bet`.
- The stake is taken the moment the reels start; a win is credited once the last reel has stopped.
- A spin is refused while the balance is below the bet.

## Spin

- All reels start spinning at the same moment.
- They stop one at a time, **left to right**, with a configurable delay between each stop (`settings.reelStopDelay`).
- The first reel stops after `settings.spinDuration`; each following reel stops one delay later. Total spin length is therefore `spinDuration + (reels - 1) * reelStopDelay` — unless the last reel is held back (see [Anticipation](#anticipation)).
- Setting `reelStopDelay` to `0` makes all reels stop together.
- The strip travels at `settings.spinSpeed` symbols per second (currently 20).
- A reel does not halt on the spot: it keeps sliding until it has fed its three outcome symbols in on top and lined them back up with the row grid, which takes up to four symbols of travel. Keep `reelStopDelay` above that worst case (`(rows + 1) * 1000 / spinSpeed`, currently 200ms) or the stop order can blur.
- Landing ends with a pushback: the strip dips `settings.bounceDistance` of a symbol below the row grid and eases back up over `settings.bounceDuration`. It is cosmetic — the reel counts as stopped the moment it reaches the grid, before the dip.
- The spin is considered over once the last reel stops; only then is the win evaluated.

## Anticipation

- When every reel but the last has landed on the same payline symbol, three of a kind is still in play and the last reel is drawn out: it spins `settings.anticipationSpins` times as long as it otherwise would (currently 3, so 4800ms instead of 1600ms).
- Everything but the background is zoomed in over the wait: the machine, the pannels and the spin button all grow together to `settings.anticipationZoom` of their size, evenly, about the middle of the screen, so the game fills more of it the longer the last reel holds out. The rows show the same amount of themselves throughout — the reel window grows with them — and the background is left where it is, still behind the zoom.
- The zoom runs from the moment the reel before the held-back one lands until the held-back one lands, and then the game jumps straight back to size — there is no animation on the way back.
- `anticipation` plays once as the zoom starts, over the spin loop.
- A pair on the first two reels always draws the third reel out, whether it lands on the match or not. The outcome is decided before the reels move, so the anticipation is only ever a build-up and never says how the spin ends.

## Winning

Evaluated on the middle row only:

| Middle row                              | Pays                                 |
| --------------------------------------- | ------------------------------------ |
| 3 matching symbols                      | bet x 100 (`settings.payouts.three`) |
| First two matching, third different     | bet x 10 (`settings.payouts.two`)    |
| First two different                     | nothing                              |

- One matching symbol on its own pays nothing.
- A win has to start on the first reel, so a pair only counts on reels 1 and 2. A pair on reels 2 and 3 pays nothing, and neither does a first-and-third match.
- Only one win is paid per spin: three of a kind pays the big amount instead of, not in addition to, the small amount.
- The win amount scales with the bet.
- The multipliers are flat, the same for every symbol, and live in `src/config/game.settings.ts` alongside the rest of the game config.

## Showing a win

- The `Win` pannel takes the amount as soon as the last reel has stopped, and keeps it until the next spin starts.
- A winning spin is also announced over the middle of the reels (`src/layout/Win.layout.ts`), with the amount counting up from zero over `settings.winCountDuration`.
- The reveal is held for `settings.winDuration` on a win. The announcement comes down with it, when the game returns to idle and the spin button unlocks.
- A losing spin has no reveal at all: the game returns to idle the moment the last reel lands, so the spin button is ready again with no wait.
