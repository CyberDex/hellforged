import { afterEach, describe, expect, it, vi } from 'vitest';
import { gameDefinition } from 'config/game.definition';
import { gmeSettings } from 'config/game.settings';
import { ApiController } from './api.controller';

const onPayline = (...symbols: string[]) =>
    symbols.map((symbol) => ['above', symbol, 'below']);

describe('ApiController', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it.each([
        { symbols: ['H1', 'H1', 'H1'], bet: 2, win: 60 },
        { symbols: ['H5', 'H5', 'H5'], bet: 10, win: 90 },
        { symbols: ['H2', 'H2', 'H3'], bet: 4, win: 8 },
        { symbols: ['H4', 'H3', 'H4'], bet: 20, win: 0 },
    ])(
        'returns the forced $symbols outcome at bet $bet',
        async ({ symbols, bet, win }) => {
            vi.useFakeTimers();

            const api = new ApiController();
            const grid = onPayline(...symbols);

            api.force(grid);

            const pending = api.spin(bet);

            await vi.advanceTimersByTimeAsync(gmeSettings.responseTime);

            await expect(pending).resolves.toMatchObject({ grid, win });
        },
    );

    it('consumes a forced outcome after one spin', async () => {
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValue(0);

        const api = new ApiController();
        const forced = onPayline('H1', 'H1', 'H1');

        api.force(forced);

        const forcedSpin = api.spin(1);

        await vi.advanceTimersByTimeAsync(gmeSettings.responseTime);
        await expect(forcedSpin).resolves.toMatchObject({ grid: forced });

        const randomSpin = api.spin(1);

        await vi.advanceTimersByTimeAsync(gmeSettings.responseTime);
        await expect(randomSpin).resolves.toMatchObject({
            grid: gameDefinition.strips.map((strip) =>
                strip.slice(0, gameDefinition.rows),
            ),
        });
    });
});
