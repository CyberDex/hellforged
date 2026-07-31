// The maths of the game, whole: pure functions over a `GameDefinition`, with
// nothing of Pixi or the DOM in them, so the same code decides a spin under
// the game, under the stand-in API, and under `scripts/simulate.ts`.

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

export type Win = {
    amount: number;
    symbol: string;
    line: number;
    positions: Position[];
};

export type SpinResult = {
    grid: string[][];
    wins: Win[];
    win: number;
    // Set when the reels from `fromReel` on land with a win still hanging.
    anticipation?: { fromReel: number };
};

// One stop per strip, the window read off it wrapping over the end.
export function rollGrid({ strips, rows }: GameDefinition): string[][] {
    return strips.map((strip) => {
        const stop = Math.floor(Math.random() * strip.length);

        return Array.from(
            { length: rows },
            (_, row) => strip[(stop + row) % strip.length],
        );
    });
}

// One win per line: a run pays at its own length, not the shorter ones inside.
export function evaluate(
    grid: string[][],
    definition: GameDefinition,
    bet: number,
): Win[] {
    const { partial, full } = definition.payouts;
    // Longest first, so a run is priced by the first length it covers.
    const partials = Object.keys(partial)
        .map(Number)
        .sort((a, b) => b - a);
    const wins: Win[] = [];

    definition.lines.forEach((line, index) => {
        const landed = line.map((row, reel) => grid[reel][row]);
        const [symbol] = landed;
        const off = landed.findIndex((face) => face !== symbol);
        const run = off === -1 ? landed.length : off;
        const count =
            run === landed.length
                ? run
                : partials.find((listed) => listed <= run);
        const multiplier =
            count === landed.length ? full[symbol] : count && partial[count];

        if (!count || !multiplier) return;

        wins.push({
            amount: bet * multiplier,
            symbol,
            line: index,
            positions: line
                .slice(0, count)
                .map((row, reel) => [reel, row] as Position),
        });
    });

    return wins;
}

// A line still on its opening symbol at the last reel can still fill, so that
// reel is held back. Never on a machine one reel wide.
export function anticipation(
    grid: string[][],
    definition: GameDefinition,
): SpinResult['anticipation'] {
    const last = definition.strips.length - 1;

    if (last < 1) return undefined;

    const filling = definition.lines.some((line) =>
        line
            .slice(0, -1)
            .every((row, reel) => grid[reel][row] === grid[0][line[0]]),
    );

    return filling ? { fromReel: last } : undefined;
}

// The one call the game makes; cheats hand the grid in instead of rolling.
export function spin(
    definition: GameDefinition,
    bet: number,
    grid = rollGrid(definition),
): SpinResult {
    const wins = evaluate(grid, definition, bet);

    return {
        grid,
        wins,
        win: wins.reduce((total, { amount }) => total + amount, 0),
        anticipation: anticipation(grid, definition),
    };
}
