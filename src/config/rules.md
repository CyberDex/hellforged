# Game Rules

A 3x3 slot with a single payline.

## Grid

- 3 reels, 3 rows (`settings.reels`, `settings.rows`).
- Only the **middle row** participates in wins — one symbol per reel, 3 symbols total.
- The **top** and **bottom** rows are purely visual (they exist to show the reel strip). They never form or extend a win.

## Symbols

Five symbols, no wilds or scatters:

`H1`, `H2`, `H3`, `H4`, `H5` (`settings.symbols`)

They differ only in what three of them pay, `H1` the most and `H5` the least (`settings.payouts.three`, which is where the symbol list itself comes from — a symbol on a reel is a symbol with a payout).

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

- When every reel but the last has landed on the same payline symbol, three of a kind is still in play and the last reel is drawn out: it spins `settings.anticipationSpins` times as long as it otherwise would (currently 2, so 3200ms instead of 1600ms).
- Everything but the background is zoomed in over the wait: the machine, the pannels and the spin button all grow together to `settings.anticipationZoom` of their size, evenly, about the middle of the screen, so the game fills more of it the longer the last reel holds out. The rows show the same amount of themselves throughout — the reel window grows with them — and the background is left where it is, still behind the zoom.
- The zoom runs from the moment the reel before the held-back one lands until the held-back one lands, and is fully in by the time it does. What happens next is the only thing about the anticipation that depends on the outcome:
    - **The last symbol misses** — the reels jump straight back out to size, with none of the travel the zoom had, and the pair is paid at normal size.
    - **The last symbol matches** — the zoom is held. The reveal comes up inside it and the game only drops back to size when it returns to idle (see [Showing a win](#showing-a-win)).
- `anticipation` plays once as the zoom starts, over the spin loop.
- A pair on the first two reels always draws the third reel out, whether it lands on the match or not. The outcome is decided before the reels move, so the anticipation is only ever a build-up and never says how the spin ends.

## Winning

Evaluated on the middle row only:

| Middle row                          | Pays                                              |
| ----------------------------------- | ------------------------------------------------- |
| 3 matching symbols                  | bet x the symbol's own (`settings.payouts.three`) |
| First two matching, third different | bet x 2 (`settings.payouts.two`)                  |
| First two different                 | nothing                                           |

Three of a kind pays on the symbol it filled up with:

| Symbol | Pays     |
| ------ | -------- |
| `H1`   | bet x 30 |
| `H2`   | bet x 18 |
| `H3`   | bet x 12 |
| `H4`   | bet x 10 |
| `H5`   | bet x 9  |

- One matching symbol on its own pays nothing.
- A win has to start on the first reel, so a pair only counts on reels 1 and 2. A pair on reels 2 and 3 pays nothing, and neither does a first-and-third match.
- Only one win is paid per spin: three of a kind pays on its symbol instead of, not in addition to, the pair it contains.
- The win amount scales with the bet.
- A pair pays the same whatever symbol it is; only three of a kind reads the symbol.
- The payouts live in `src/config/game.settings.ts` alongside the rest of the game config.
- Every symbol is as likely as every other, so the payline fills up on 1 spin in 25 and leaves a pair on 4 in 25. Between them the table pays back about 95% of what is staked over time (`(30+18+12+10+9)/125 + 0.16 x 2`), so a balance drifts down rather than either way.

## Showing a win

- The `Win` pannel takes the amount as soon as the last reel has stopped, and keeps it until the next spin starts.
- A winning spin is also announced over the middle of the reels (`src/layout/Win.layout.ts`), with the amount counting up from zero rather than printed.
- A pair is held for `settings.winDuration` and counts up over `settings.winCountDuration` of it, so the amount settles well before the announcement comes down.
- Three of a kind is held for `settings.bigWinReveals` times as long (currently 2, so 5000ms) and counts up over that whole time, so the number is still climbing to the top win for as long as it is up. It is read out from inside the anticipation zoom, which is only dropped once the reveal is over.
- The announcement comes down when the game returns to idle and the spin button unlocks.
- A losing spin has no reveal at all: the game returns to idle the moment the last reel lands, so the spin button is ready again with no wait.
