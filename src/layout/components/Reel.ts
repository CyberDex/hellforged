import { Container, Rectangle, Ticker } from 'pixi.js';
import { settings } from 'config/game.settings';
import { visuals } from 'config/visual.settings';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
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
    // The symbols still to be fed in on top before the reel can land.
    #queue: string[] = [];
    // The dip the reel is riding out, once it has landed, and how far below the
    // row grid that currently has the strip sitting.
    #bounce?: Tween;
    #offset = 0;
    // What the reel is strung with, which is where every face it shows in
    // passing is drawn from.
    #strip: string[];

    constructor(slots: number, strip: string[]) {
        super();

        this.#strip = strip;

        // One spare symbol above the reel: it fills the top row while the
        // others slide down.
        for (let i = -1; i < slots; i++) {
            const symbol = new Symbol(this.face());

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

    // The rows a win covers stay at full face and the rest step back, so the
    // grid itself says which of its cells were paid for. `null` is the reel at
    // rest: every face forward. The spare above the grid steps back with the
    // losers, unseen behind the window either way.
    highlight(rows: number[] | null) {
        this.#slots.forEach((slot, index) => {
            // #slots runs top to bottom from the spare symbol above the grid,
            // so the rows start one past it.
            slot.alpha =
                !rows || rows.includes(index - 1)
                    ? 1
                    : visuals.machine.dimmedFace;
        });
    }

    spin() {
        // Resumes the reel if the previous spin is still landing or bouncing.
        this.#stopping = false;

        // A dip is momentum off a landing rather than travel, so a reel asked
        // to go again mid-dip is put straight back on the grid and spun from
        // there rather than carrying the offset into the next spin.
        if (this.#bounce) {
            this.#bounce.stop();
            this.#bounce = undefined;

            this.move(-this.#offset);

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
            this.land(align);

            return;
        }

        this.move(distance);
    }

    // The last move of a spin, sliding the outcome down onto the rows. The reel
    // has landed as far as the game is concerned once it has: the travel is
    // over and comes off the clock, and the dip that follows it is momentum.
    private land(align: number) {
        this.move(align);

        this.#stopping = false;
        this.#spinning = false;

        Ticker.shared.remove(this.tick, this);

        this.emit('stopped');

        this.#bounce = tween.run({
            duration: settings.bounceDuration,
            to: settings.bounceDistance * this.#symbolHeight,
            ease: dip,
            // Driven from an absolute offset rather than per-frame deltas, so
            // the strip comes back to the grid exactly where it landed.
            onUpdate: (offset) => {
                this.move(offset - this.#offset);

                this.#offset = offset;
            },
            // On the grid whatever the dip was tuned to, rather than wherever
            // its last frame happened to leave the strip.
            onComplete: () => {
                this.move(-this.#offset);

                this.#offset = 0;
                this.#bounce = undefined;
            },
        });
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
            // Off the queue while the reel is landing, off the strip for as
            // long as it is still spinning.
            bottom.symbol = this.#queue.shift() ?? this.face();

            this.#slots.pop();
            this.#slots.unshift(bottom);
        }
    }

    // A face drawn off the strip, for rows that are only passing by: the blur
    // of a spin shows symbols in the company the strip actually keeps them in,
    // so a symbol strung on rarely is rare in passing too.
    private face() {
        return this.#strip[Math.floor(Math.random() * this.#strip.length)];
    }
}
