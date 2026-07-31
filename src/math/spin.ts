import { anticipation } from './anticipation.ts';
import type { Anticipation } from './anticipation.ts';
import type { GameDefinition } from './definition.ts';
import { evaluate } from './evaluate.ts';
import type { Win } from './evaluate.ts';
import { rollGrid } from './rollGrid.ts';

export type SpinResult = {
    grid: string[][];
    wins: Win[];
    win: number;
    // Set when the reels from `fromReel` on land with a win still hanging.
    anticipation?: Anticipation;
};

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
