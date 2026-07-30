import { settings } from 'config/game.settings';
import { getRandomSymbol } from 'utils/getRandomSymbol';

export type SpinOutcome = {
    // The symbols every reel has to land on, top to bottom.
    reels: string[][];
    // What the spin lands on the paying row, one symbol per reel.
    payline: string[];
    win: number;
};

// The payline: the middle row is the only one that pays.
const PAYLINE = Math.floor(settings.rows / 2);

// Stands in for the server. The whole spin is decided here, before a reel has
// stopped, so the reels only ever play back an outcome they were handed.
class BackendController {
    // What the next spin has to land on the paying row, instead of rolling for
    // it. Only ever set from the dev panel's cheats.
    #forced: string[] | null = null;

    // The forced payline is spent by the spin that follows, so one press of a
    // cheat is one spin and the game rolls for itself again after it.
    force(payline: string[]) {
        this.#forced = payline;
    }

    spin(bet: number): SpinOutcome {
        const forced = this.#forced;

        this.#forced = null;

        // Only the row that pays is dictated; the rest of every reel is rolled
        // as usual, so a forced spin still lands looking like any other.
        const reels = Array.from({ length: settings.reels }, (_, reel) =>
            Array.from({ length: settings.rows }, (_, row) =>
                forced && row === PAYLINE ? forced[reel] : getRandomSymbol(),
            ),
        );

        const payline = reels.map((reel) => reel[PAYLINE]);

        return { reels, payline, win: bet * this.multiplier(payline) };
    }

    // A win has to start on the first reel, so a pair only counts on the first
    // two. Only one win is paid per spin: three of a kind pays on its symbol
    // instead of the pair it contains, not on top of it.
    private multiplier([first, second, third]: string[]) {
        if (first !== second) return 0;

        return second === third
            ? settings.payouts.three[second]
            : settings.payouts.two;
    }
}

export const backend = new BackendController();
