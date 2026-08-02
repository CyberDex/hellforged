import { describe, expect, it } from 'vitest';
import { spin } from './spin.ts';
import type { GameDefinition } from './definition.ts';

const definition: GameDefinition = {
    strips: [
        ['A', 'B'],
        ['A', 'B'],
        ['A', 'B'],
    ],
    rows: 2,
    lines: [
        [0, 0, 0],
        [1, 1, 1],
    ],
    payouts: {
        partial: { 2: 2 },
        full: { A: 10, B: 5 },
    },
};

describe('spin', () => {
    it.each([
        {
            name: 'adds wins from every payline',
            grid: [
                ['A', 'B'],
                ['A', 'B'],
                ['A', 'B'],
            ],
            bet: 3,
            amounts: [30, 15],
            total: 45,
            anticipation: { fromReel: 2 },
        },
        {
            name: 'returns a losing forced grid unchanged',
            grid: [
                ['A', 'A'],
                ['B', 'B'],
                ['A', 'A'],
            ],
            bet: 3,
            amounts: [],
            total: 0,
            anticipation: undefined,
        },
    ])('$name', ({ grid, bet, amounts, total, anticipation }) => {
        const result = spin(definition, bet, grid);

        expect(result.grid).toBe(grid);
        expect(result.wins.map(({ amount }) => amount)).toEqual(amounts);
        expect(result.win).toBe(total);
        expect(result.anticipation).toEqual(anticipation);
    });
});
