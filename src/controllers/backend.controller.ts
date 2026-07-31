import { definition } from 'config/game.definition';
import { spin } from 'engine/engine';
import type { SpinResult } from 'engine/engine';

// Stands in for the server: the seam a real backend would sit behind,
// answering with the same `SpinResult`. The deciding itself is the engine's.
class BackendController {
    #forced: string[][] | null = null;

    // Spent by the spin that follows: one press of a cheat is one spin.
    force(grid: string[][]) {
        this.#forced = grid;
    }

    spin(bet: number): SpinResult {
        const forced = this.#forced;

        this.#forced = null;

        return spin(definition, bet, forced ?? undefined);
    }
}

export const backend = new BackendController();
