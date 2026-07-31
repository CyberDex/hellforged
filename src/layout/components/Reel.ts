import { Container, Rectangle, Ticker } from 'pixi.js';
import { settings } from 'config/game.settings';
import { getRandomSymbol } from 'utils/getRandomSymbol';
import { Symbol } from './Symbol';

// 0 -> 1 -> 0. Down with the momentum the reel landed with, decelerating into
// the dip, then eased off the dip and onto the grid, over the share of the
// bounce each is configured to have.
function dip(progress: number): number {
    const { bounceDown } = settings;

    if (progress < bounceDown) {
        const down = progress / bounceDown;

        return down * (2 - down);
    }

    const back = (progress - bounceDown) / (1 - bounceDown);

    return (1 + Math.cos(back * Math.PI)) / 2;
}

export class Reel extends Container {
    #slots: Symbol[] = [];
    #symbolHeight: number;
    #reelHeight: number;
    #speed: number;
    #spinning = false;
    #stopping = false;
    #bouncing = false;
    #elapsed = 0;
    // The symbols still to be fed in on top before the reel can land.
    #queue: string[] = [];
    // How far the strip currently sits below the row grid, mid-bounce.
    #offset = 0;

    constructor(slots: number) {
        super();

        // One spare symbol above the reel: it fills the top row while the
        // others slide down.
        for (let i = -1; i < slots; i++) {
            const symbol = new Symbol();

            symbol.y = i * symbol.height;

            this.#slots.push(symbol);
            this.addChild(symbol);
        }

        this.#symbolHeight = this.#slots[0].height;
        this.#reelHeight = slots * this.#symbolHeight;
        // Symbols per second, as configured, in pixels per millisecond.
        this.#speed = (this.#symbolHeight * settings.spinSpeed) / 1000;

        // Fixed bounds, so the spare symbol stays out of the layout measurement.
        this.boundsArea = new Rectangle(
            0,
            0,
            this.#slots[0].width,
            this.#reelHeight,
        );
    }

    get slots(): Symbol[] {
        return this.#slots;
    }

    // Puts the reel straight onto a set of symbols, with none of the travel a
    // spin arrives on, so a spin that has already been played can be put back
    // on the rows it landed on.
    set symbols(symbols: string[]) {
        for (let row = 0; row < symbols.length; row++) {
            // #slots runs top to bottom from the spare symbol above the grid,
            // so the rows start one past it. The spare is left as it is, since
            // it is never on the grid to be seen.
            const slot = this.#slots[row + 1];

            if (slot) slot.symbol = symbols[row];
        }
    }

    spin() {
        // Resumes the reel if the previous spin is still landing or bouncing.
        this.#stopping = false;

        if (this.#bouncing) {
            this.move(-this.#offset);

            this.#bouncing = false;
            this.#offset = 0;
        }

        if (this.#spinning) return;

        this.#spinning = true;

        Ticker.shared.add(this.tick, this);
    }

    // The reel lands on the symbols it is given, bottom row last: they enter
    // on top and slide down onto the rows as the reel comes to rest.
    stop(symbols: string[]) {
        this.#queue = [...symbols].reverse();
        this.#stopping = true;
    }

    private tick({ deltaMS }: Ticker) {
        if (this.#bouncing) {
            this.bounce(deltaMS);

            return;
        }

        // The top symbol rests at -#symbolHeight, so this is what is left to
        // travel for the symbols to land back on the row grid — a whole symbol
        // when they are on it already.
        const align =
            -this.#slots[0].y % this.#symbolHeight || this.#symbolHeight;
        // A stopping reel never travels past the grid in one step, however long
        // the frame was, so the queue is fed in a row at a time.
        const distance = this.#stopping
            ? Math.min(this.#speed * deltaMS, align)
            : this.#speed * deltaMS;

        // Landing waits for the queue to be fed in: by the time it is empty the
        // outcome sits one row above the grid, and this last move slides it
        // down onto the rows.
        if (this.#stopping && !this.#queue.length && align <= distance) {
            this.move(align);

            this.#stopping = false;
            // The reel has landed as far as the game is concerned; the dip
            // that follows is momentum, not travel.
            this.#bouncing = true;
            this.#elapsed = 0;

            this.emit('stopped');

            return;
        }

        this.move(distance);
    }

    private bounce(deltaMS: number) {
        this.#elapsed += deltaMS;

        const progress = Math.min(this.#elapsed / settings.bounceDuration, 1);
        // Driven from an absolute offset rather than per-tick deltas, so the
        // strip comes back to the grid exactly where it landed.
        const offset =
            progress < 1
                ? dip(progress) * settings.bounceDistance * this.#symbolHeight
                : 0;

        this.move(offset - this.#offset);

        this.#offset = offset;

        if (progress < 1) return;

        this.#bouncing = false;
        this.#spinning = false;

        Ticker.shared.remove(this.tick, this);
    }

    private move(distance: number) {
        for (const symbol of this.#slots) symbol.y += distance;

        // Once the spare symbol has come down onto the top row, the bottom one
        // has slid out under the reel and comes back in on top with a new face,
        // which keeps #slots ordered from top to bottom. Going by the spare is
        // what keeps this in step with a landing, which is aimed at it too.
        while (this.#slots[0].y >= 0) {
            const bottom = this.#slots[this.#slots.length - 1];

            bottom.y = this.#slots[0].y - this.#symbolHeight;
            // Off the queue while the reel is landing, random for as long as
            // it is still spinning.
            bottom.symbol = this.#queue.shift() ?? getRandomSymbol();

            this.#slots.pop();
            this.#slots.unshift(bottom);
        }
    }
}
