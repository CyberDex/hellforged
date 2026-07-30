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
    spin(bet: number): SpinOutcome {
        const reels = Array.from({ length: settings.reels }, () =>
            Array.from({ length: settings.rows }, () => getRandomSymbol()),
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
