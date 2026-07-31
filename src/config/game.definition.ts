// The maths half of the game, as data: another machine shape is another one
// of these, not other code. The type import is relative with its extension so
// plain node can run this and the maths for `scripts/simulate.ts`.
import type { GameDefinition } from '../math/definition.ts';

// Full-line payouts in bets — also the set of symbols the game plays with.
const full: Record<string, number> = {
    H1: 30,
    H2: 18,
    H3: 12,
    H4: 10,
    H5: 9,
};

// Payouts for a run short of a full line, by length. Flat, whatever the symbol.
const partial: Record<number, number> = {
    2: 2,
};

// Every symbol appears on every strip equally often, so the priced odds hold:
// this 3x3 fills the line 1 in 25, pairs 4 in 25, ~95% back — `pnpm sim`
// verifies. The order only decides what is seen; no symbol sits beside
// itself, wrap included.
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

export const gameDefinition: GameDefinition = {
    strips,
    rows: 3,
    // One payline, on the middle row of every reel.
    lines: [[1, 1, 1]],
    payouts: { partial, full },
};

export const symbols = Object.keys(full);
