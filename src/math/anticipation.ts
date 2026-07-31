import type { GameDefinition } from './definition.ts';

export type Anticipation = { fromReel: number };

// A line still on its opening symbol at the last reel can still fill, so that
// reel is held back. Never on a machine one reel wide.
export function anticipation(
    grid: string[][],
    definition: GameDefinition,
): Anticipation | undefined {
    const last = definition.strips.length - 1;

    if (last < 1) return undefined;

    const filling = definition.lines.some((line) =>
        line
            .slice(0, -1)
            .every((row, reel) => grid[reel][row] === grid[0][line[0]]),
    );

    return filling ? { fromReel: last } : undefined;
}
