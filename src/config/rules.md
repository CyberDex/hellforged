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

## Spin

- All reels start spinning at the same moment.
- They stop one at a time, **left to right**, with a configurable delay between each stop (`settings.reelStopDelay`).
- The first reel stops after `settings.spinDuration`; each following reel stops one delay later. Total spin length is therefore `spinDuration + (reels - 1) * reelStopDelay`.
- Setting `reelStopDelay` to `0` makes all reels stop together.
- The strip travels at `settings.spinSpeed` symbols per second (currently 20).
- A reel does not halt on the spot: it keeps sliding until its symbols line back up with the row grid, which takes anywhere from 0 to one symbol of travel. Keep `reelStopDelay` above that worst case (`1000 / spinSpeed`, currently 50ms) or the stop order can blur.
- The spin is considered over once the last reel stops; only then is the win evaluated.

## Winning

Evaluated on the middle row only:

| Middle row              | Result     |
| ----------------------- | ---------- |
| 3 matching symbols      | Big win    |
| Exactly 2 matching      | Small win  |
| All 3 different         | No win     |

- Position does not matter for a 2-of-a-kind — the matching pair can sit on any two of the three reels.
- Only one win is paid per spin: three of a kind pays the big amount instead of, not in addition to, the small amount.
- The win amount scales with the bet.

## Not yet defined

The concrete payout multipliers (per symbol, or flat for the 2- and 3-match tiers) are still open. Once decided they belong in `src/config/settings.ts` alongside the rest of the game config.
