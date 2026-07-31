import { Container, Rectangle, Ticker } from 'pixi.js';
import { settings } from 'config/game.settings';
import { visuals } from 'config/visual.settings';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
import { Symbol } from './Symbol';

// 0 -> 1 -> 0: down with landing momentum, eased back onto the grid.
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
    #queue: string[] = [];
    #bounce?: Tween;
    #offset = 0;
    #strip: string[];

    constructor(slots: number, strip: string[]) {
        super();

        this.#strip = strip;

        // One spare symbol above the reel fills the top row mid-slide.
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

        // Fixed bounds keep the spare symbol out of layout measurement.
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

    set symbols(symbols: string[]) {
        for (let row = 0; row < symbols.length; row++) {
            // #slots starts with the spare above the grid, so rows sit one past it.
            const slot = this.#slots[row + 1];

            if (slot) slot.symbol = symbols[row];
        }
    }

    highlight(rows: number[] | null) {
        this.#slots.forEach((slot, index) => {
            slot.alpha =
                !rows || rows.includes(index - 1)
                    ? 1
                    : visuals.machine.dimmedFace;
        });
    }

    spin() {
        this.#stopping = false;

        // A dip is momentum, not travel: mid-dip the reel goes straight back
        // onto the grid rather than carrying the offset into the next spin.
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

    stop(symbols: string[]) {
        this.#queue = [...symbols].reverse();
        this.#stopping = true;
    }

    private tick({ deltaMS }: Ticker) {
        // Travel left to land back on the grid — a whole symbol when on it.
        const align =
            -this.#slots[0].y % this.#symbolHeight || this.#symbolHeight;
        // A stopping reel never passes the grid in one step, however long the
        // frame was, so the queue is fed in a row at a time.
        const distance = this.#stopping
            ? Math.min(this.#speed * deltaMS, align)
            : this.#speed * deltaMS;

        if (this.#stopping && !this.#queue.length && align <= distance) {
            this.land(align);

            return;
        }

        this.move(distance);
    }

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
            // Absolute offset, so the strip returns exactly where it landed.
            onUpdate: (offset) => {
                this.move(offset - this.#offset);

                this.#offset = offset;
            },
            onComplete: () => {
                this.move(-this.#offset);

                this.#offset = 0;
                this.#bounce = undefined;
            },
        });
    }

    private move(distance: number) {
        for (const symbol of this.#slots) symbol.y += distance;

        // Once the spare reaches the top row, the bottom symbol wraps back in
        // on top with a new face, keeping #slots ordered top to bottom.
        while (this.#slots[0].y >= 0) {
            const bottom = this.#slots[this.#slots.length - 1];

            bottom.y = this.#slots[0].y - this.#symbolHeight;
            bottom.symbol = this.#queue.shift() ?? this.face();

            this.#slots.pop();
            this.#slots.unshift(bottom);
        }
    }

    // Passing faces come off the strip, so a rare symbol is rare in passing.
    private face() {
        return this.#strip[Math.floor(Math.random() * this.#strip.length)];
    }
}
