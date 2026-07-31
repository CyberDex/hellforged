// The maths of the game, whole: what a spin lands on and what that pays. Pure
// functions over a `GameDefinition`, with nothing of Pixi or the DOM in them,
// so the same code decides a spin under the game, under the backend standing
// in for a server, and under `scripts/simulate.ts` counting the return. The
// definition they read lives in `config/game.definition.ts`.

// A game, as far as the maths is concerned. Everything else about it — what a
// symbol looks like, how long a reel spins — is presentation, and lives in the
// settings instead.
export interface GameDefinition {
    // One strip per reel: the loop of symbols the reel is strung with. The
    // machine is as many reels wide as there are strips, and a spin is one
    // stop per strip, with the window read off it from there. How often a
    // symbol is strung on, and where, is what weights the game's maths beyond
    // the paytable.
    strips: string[][];
    // How many rows of each strip the window shows.
    rows: number;
    // The lines that pay: for each, the row it reads on every reel, left to
    // right. As much data as the strips are, so a line is added rather than
    // coded.
    lines: number[][];
    payouts: {
        // What a win short of a full line pays, in bets, by the number of
        // reels its run covers. Flat, whatever the symbol.
        partial: Record<number, number>;
        // What a full line pays, in bets, on the symbol it filled up with.
        full: Record<string, number>;
    };
}

// One cell of the grid: which reel, and which row of it.
export type Position = [reel: number, row: number];

// One win, placed: what it pays and the cells it was paid for, so whatever
// shows the win knows where to point.
export type Win = {
    amount: number;
    symbol: string;
    // Which of the definition's lines it was read on.
    line: number;
    positions: Position[];
};

// What a spin is, in full, before a reel has moved — and the shape a real
// server would answer with in place of `backend.controller.ts`.
export type SpinResult = {
    // The symbols every reel lands on, top to bottom.
    grid: string[][];
    wins: Win[];
    // What the wins pay between them, which is what goes onto the balance.
    win: number;
    // Set when the spin is worth drawing out: the reels from `fromReel` on are
    // the ones a win still hangs on as they land.
    anticipation?: { fromReel: number };
};

// A spin is one stop per reel: somewhere on its strip, with the window read
// off it from there, wrapping over the end. Every row of the window comes off
// the strip together, so what rides above and below the paying rows is as
// governed by the strip as they are.
export function rollGrid({ strips, rows }: GameDefinition): string[][] {
    return strips.map((strip) => {
        const stop = Math.floor(Math.random() * strip.length);

        return Array.from(
            { length: rows },
            (_, row) => strip[(stop + row) % strip.length],
        );
    });
}

// What the grid pays, line by line. Each line is read for the run of one
// symbol it opens on — how many reels it goes before it comes off the symbol
// on the first one. A run that reaches every reel is a filled line and pays on
// its symbol; anything short of it pays flat, at the longest length the
// paytable lists that the run covers, and nothing at all if it covers none.
// One win per line: a run pays at its own length instead of the shorter ones
// inside it, not on top of them.
export function evaluate(
    grid: string[][],
    definition: GameDefinition,
    bet: number,
): Win[] {
    const { partial, full } = definition.payouts;
    // The lengths that pay short of a full line, longest first, so a run is
    // priced by the first of them it covers.
    const partials = Object.keys(partial)
        .map(Number)
        .sort((a, b) => b - a);
    const wins: Win[] = [];

    definition.lines.forEach((line, index) => {
        const landed = line.map((row, reel) => grid[reel][row]);
        const [symbol] = landed;
        // Where the line first comes off the symbol it opened on, which is how
        // many reels the run covers — the whole line when it never does.
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
            // The cells the win is paid for: the run, as far as it was priced.
            positions: line
                .slice(0, count)
                .map((row, reel) => [reel, row] as Position),
        });
    });

    return wins;
}

// Whether the spin is worth drawing out, and from which reel: a line that has
// kept to the symbol it opened on all the way to the last reel can still fill,
// so the last reel is held back and the game leans in for it. Never on a
// machine one reel wide, which has nothing left to hold once its first reel
// has landed.
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

// A whole spin: rolled, unless it is handed the grid it has to land on (the
// dev panel's cheats), then read for what it pays and whether it is worth
// drawing out. This is the one call the game makes of the maths.
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
