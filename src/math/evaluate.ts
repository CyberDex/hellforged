import type { GameDefinition, Position } from './definition.ts';

export type Win = {
    amount: number;
    symbol: string;
    line: number;
    positions: Position[];
};

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
