import { definition, symbols } from 'config/game.definition';
import { rollGrid } from 'engine/engine';
import { gameStore } from 'store/game.store';
import { API } from '../api.controller';
import { game } from '../game.controller';

// Forced wins for the dev tools: every payout the machine knows and the
// rigged spin that lands it; knows nothing of the pane that lists them.
class CheatsController {
    get canSpin() {
        return game.canSpin;
    }

    // The pane keeps its buttons in step with the game.
    follow(listener: () => void) {
        listener();
        gameStore.subscribe(listener);
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
        if (!game.canSpin) return;

        API.force(this.grid(symbol, count));
        game.spin();
    }

    // Shortest first; lengths the machine has no reels for are left off.
    private wins(symbol: string) {
        const { partial, full } = definition.payouts;
        const reels = definition.strips.length;
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
        const grid = rollGrid(definition);
        const miss = symbols[(symbols.indexOf(symbol) + 1) % symbols.length];

        definition.lines[0].forEach((row, reel) => {
            grid[reel][row] = reel < count ? symbol : miss;
        });

        return grid;
    }
}

export const cheats = new CheatsController();
