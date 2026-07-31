// The maths of the game lives in this folder: pure functions over the
// `GameDefinition` below, with nothing of Pixi or the DOM in them, so the
// same code decides a spin under the game, under the stand-in API, and under
// `scripts/simulate.ts`. Imports in here stay relative, extensions included,
// so plain node can run the folder.

export interface GameDefinition {
    // One strip per reel; how often a symbol is strung on weights the maths.
    strips: string[][];
    rows: number;
    // For each payline, the row it reads on every reel, left to right.
    lines: number[][];
    payouts: {
        // In bets, for a run short of a full line, by length, any symbol.
        partial: Record<number, number>;
        // In bets, for a full line, by symbol.
        full: Record<string, number>;
    };
}

export type Position = [reel: number, row: number];
