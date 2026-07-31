import { definition } from 'config/game.definition';
import { settings } from 'config/game.settings';
import { spin } from 'math/spin';
import type { SpinResult } from 'math/spin';

// Stands in for the server: the seam a real backend would sit behind,
// answering with the same `SpinResult`. The deciding itself lives in `math/`.
// TODO: rewrite this to be DI controller to accept a real backend,
//  and make the backend controller a thin wrapper around it.
class ApiController {
    #forced: string[][] | null = null;

    // Spent by the spin that follows: one press of a cheat is one spin.
    force(grid: string[][]) {
        this.#forced = grid;
    }

    async spin(bet: number): Promise<SpinResult> {
        const forced = this.#forced;

        this.#forced = null;

        // The round trip a real server would take: the reels are already
        // turning before the outcome is known.
        await new Promise((resolve) =>
            setTimeout(resolve, settings.responseTime),
        );

        return spin(definition, bet, forced ?? undefined);
    }
}

export const API = new ApiController();
