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

// The run lengths that pay short of a full payline, longest first, so a run is
// priced by the first of them it reaches.
const PARTIALS = Object.keys(settings.payouts.partial)
    .map(Number)
    .sort((a, b) => b - a);

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

    // A win has to start on the first reel, so what pays is the run of one
    // symbol the payline opens on, however many reels the game is played on.
    // Only one win is paid per spin: a run pays at its own length instead of
    // the shorter ones inside it, not on top of them.
    private multiplier(payline: string[]) {
        const [symbol] = payline;
        // Where the line first comes off the symbol it opened on, which is how
        // many reels the run covers — and nowhere at all when it never does.
        const run = payline.findIndex((landed) => landed !== symbol);

        if (run === -1) return settings.payouts.full[symbol];

        // Short of the whole line, the run is paid at the longest length the
        // paytable lists that it covers, and nothing at all if it covers none.
        const length = PARTIALS.find((listed) => listed <= run);

        return length === undefined ? 0 : settings.payouts.partial[length];
    }
}

export const backend = new BackendController();
