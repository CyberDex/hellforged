import { definition } from 'config/game.definition';
import { spin } from 'engine/engine';
import type { SpinResult } from 'engine/engine';

// Stands in for the server. The whole spin is decided here, before a reel has
// stopped, so the reels only ever play back an outcome they were handed. The
// deciding itself is the engine's (`engine/engine.ts`): this is only the seam
// a real backend would sit behind, answering with the same `SpinResult`.
class BackendController {
    // What the next spin has to land on, whole, instead of rolling for it.
    // Only ever set from the dev panel's cheats.
    #forced: string[][] | null = null;

    // The forced grid is spent by the spin that follows, so one press of a
    // cheat is one spin and the game rolls for itself again after it.
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
