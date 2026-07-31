import { describe, expect, it } from 'vitest';
import { gameDefinition } from 'config/game.definition';
import { evaluate } from './evaluate.ts';
import type { GameDefinition } from './definition.ts';

const onPayline = (...symbols: string[]) =>
    symbols.map((symbol) => ['above', symbol, 'below']);

describe('evaluate', () => {
    it.each(Object.entries(gameDefinition.payouts.full))(
        'pays the configured %s full-line multiplier',
        (symbol, multiplier) => {
            const bet = 7;

            expect(
                evaluate(
                    onPayline(symbol, symbol, symbol),
                    gameDefinition,
                    bet,
                ),
            ).toEqual([
                {
                    amount: bet * multiplier,
                    symbol,
                    line: 0,
                    positions: [
                        [0, 1],
                        [1, 1],
                        [2, 1],
                    ],
                },
            ]);
        },
    );

    it.each([
        {
            name: 'an opening pair',
            line: ['H3', 'H3', 'H4'],
            bet: 5,
            amount: 10,
            positions: [
                [0, 1],
                [1, 1],
            ],
        },
        {
            name: 'a pair after the first reel',
            line: ['H4', 'H3', 'H3'],
            bet: 5,
            amount: 0,
            positions: [],
        },
        {
            name: 'no matching run',
            line: ['H1', 'H2', 'H1'],
            bet: 5,
            amount: 0,
            positions: [],
        },
    ])('$name', ({ line, bet, amount, positions }) => {
        const wins = evaluate(onPayline(...line), gameDefinition, bet);

        expect(wins).toHaveLength(amount ? 1 : 0);

        if (amount) {
            expect(wins[0]).toMatchObject({ amount, positions });
        }
    });

    it.each([
        { run: ['A', 'A', 'B', 'B'], amount: 6, positions: 2 },
        { run: ['A', 'A', 'A', 'B'], amount: 21, positions: 3 },
        { run: ['A', 'A', 'A', 'A'], amount: 60, positions: 4 },
    ])(
        'generalizes payout multiplication to $positions reels',
        ({ run, amount, positions }) => {
            const definition: GameDefinition = {
                strips: run.map(() => ['A', 'B']),
                rows: 1,
                lines: [[0, 0, 0, 0]],
                payouts: {
                    partial: { 2: 2, 3: 7 },
                    full: { A: 20, B: 10 },
                },
            };

            expect(
                evaluate(
                    run.map((symbol) => [symbol]),
                    definition,
                    3,
                ),
            ).toEqual([
                expect.objectContaining({
                    amount,
                    positions: Array.from({ length: positions }, (_, reel) => [
                        reel,
                        0,
                    ]),
                }),
            ]);
        },
    );
});
