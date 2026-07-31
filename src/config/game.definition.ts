// The maths half of the game, as data: what the reels are strung with, which
// rows pay, and what lands there pays. The engine (`src/engine/engine.ts`) is
// the only code that reads it to decide a spin, so a machine of another shape
// — more reels, more rows, more lines, another paytable — is another one of
// these rather than other code. How the game looks and moves stays next door,
// in `game.settings.ts` and `visual.settings.ts`.
//
// The type import is spelled relative, with its extension, so this file and
// the engine stay loadable by plain node: `scripts/simulate.ts` reads the
// return straight off this definition, with no bundler in between.
import type { GameDefinition } from '../engine/engine.ts';

// What a full payline pays, in bets, on the symbol it filled up with. This is
// also the set of symbols the game plays with, so every symbol on a strip is a
// symbol with a payout.
const full: Record<string, number> = {
    H1: 30,
    H2: 18,
    H3: 12,
    H4: 10,
    H5: 9,
};

// What a win short of a full payline pays, in bets, by the number of reels its
// run covers. Flat, whatever the symbol: only a filled line reads the symbol.
// A run is paid at the longest length listed here that it reaches, so a run
// shorter than the shortest listed pays nothing, and a reel added to the game
// leaves no run unpriced — though a wider machine wants a rung of its own for
// each new length rather than paying four in a row what a pair pays.
const partial: Record<number, number> = {
    2: 2,
};

// What each reel is strung with. Every symbol appears on every strip the same
// number of times, so any single row is as likely to land one symbol as
// another and the odds the paytable was priced against hold: on this 3x3 the
// payline fills on 1 spin in 25 and is left a pair on 4 in 25, paying back
// ~95% of what is staked over time. `pnpm sim` spins the definition and reads
// the return off it, rather than trusting this comment. Stringing a symbol on
// more or fewer times — or differently from reel to reel — is how a definition
// weights its maths beyond the paytable.
//
// The order only decides what is seen: which symbols ride above and below the
// paying row, in the blur of a spin and on the rows that never pay. It is
// written so no symbol sits beside itself, wrap included, the way a drawn reel
// would be.
const strips = [
    // prettier-ignore
    ['H1', 'H3', 'H5', 'H2', 'H4', 'H1', 'H5', 'H3', 'H4', 'H2',
     'H1', 'H4', 'H2', 'H5', 'H3', 'H1', 'H2', 'H4', 'H3', 'H5'],
    // prettier-ignore
    ['H2', 'H5', 'H1', 'H4', 'H3', 'H2', 'H1', 'H5', 'H3', 'H4',
     'H2', 'H3', 'H5', 'H1', 'H4', 'H2', 'H4', 'H1', 'H3', 'H5'],
    // prettier-ignore
    ['H3', 'H1', 'H4', 'H5', 'H2', 'H3', 'H4', 'H1', 'H2', 'H5',
     'H3', 'H2', 'H1', 'H4', 'H5', 'H3', 'H5', 'H2', 'H4', 'H1'],
];

export const definition: GameDefinition = {
    strips,
    rows: 3,
    // One payline, on the middle row of every reel.
    lines: [[1, 1, 1]],
    payouts: { partial, full },
};

// The faces the game deals in, for whatever lists or draws them.
export const symbols = Object.keys(full);
