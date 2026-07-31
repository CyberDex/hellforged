import { gameDefinition, symbols } from 'config/game.definition';
import { rollGrid } from 'math/rollGrid';
import type { StoreApi } from 'zustand/vanilla';
import type { ApiController } from '../api.controller';
import type { GameActions } from '../contracts';
import type { GameStore } from 'store/game.store';

// Forced wins for the dev tools: every payout the machine knows and the
// rigged spin that lands it; knows nothing of the pane that lists them.
export class CheatsController {
    readonly #api: Pick<ApiController, 'force'>;
    readonly #game: GameActions;
    readonly #store: StoreApi<GameStore>;

    constructor(
        game: GameActions,
        api: Pick<ApiController, 'force'>,
        store: StoreApi<GameStore>,
    ) {
        this.#api = api;
        this.#game = game;
        this.#store = store;
    }

    get canSpin() {
        return this.#game.canSpin;
    }

    // The pane keeps its buttons in step with the game.
    follow(listener: () => void) {
        listener();
        this.#store.subscribe(listener);
    }

    // Every win the machine can pay, symbol by symbol, shortest first.
    list() {
        return symbols.flatMap((symbol) =>
            this.wins(symbol).map((win) => ({ symbol, ...win })),
        );
    }

    // Hands the next spin the grid it has to land on. Guarded, or a press
    // the game cannot take would leave the grid queued for an honest spin.
    spin(symbol: string, count: number) {
        if (!this.#game.canSpin) return;

        this.#api.force(this.grid(symbol, count));
        this.#game.spin();
    }

    // Shortest first; lengths the machine has no reels for are left off.
    private wins(symbol: string) {
        const { partial, full } = gameDefinition.payouts;
        const reels = gameDefinition.strips.length;
        const counts = Object.keys(partial)
            .map(Number)
            .filter((count) => count < reels)
            .sort((a, b) => a - b);

        return [
            ...counts.map((count) => ({ count, payout: partial[count] })),
            { count: reels, payout: full[symbol] },
        ];
    }

    // The reel after the run must miss, or a shorter win lands as a longer one.
    private grid(symbol: string, count: number) {
        const grid = rollGrid(gameDefinition);
        const miss = symbols[(symbols.indexOf(symbol) + 1) % symbols.length];

        gameDefinition.lines[0].forEach((row, reel) => {
            grid[reel][row] = reel < count ? symbol : miss;
        });

        return grid;
    }
}
