import { Container, Rectangle, Ticker } from 'pixi.js';
import { settings } from '../../config/game.settings';
import { Symbol } from './Symbol';

export class Reel extends Container {
    #slots: Symbol[] = [];
    #symbolHeight: number;
    #reelHeight: number;
    #speed: number;
    #spinning = false;
    #stopping = false;

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

    spin() {
        // Resumes the reel if the previous spin is still landing.
        this.#stopping = false;

        if (this.#spinning) return;

        this.#spinning = true;

        Ticker.shared.add(this.tick, this);
    }

    stop() {
        this.#stopping = true;
    }

    private tick({ deltaMS }: Ticker) {
        const distance = this.#speed * deltaMS;
        // The top symbol rests at -#symbolHeight, so this is what is left to
        // travel for the symbols to land back on the row grid.
        const align = -this.#slots[0].y % this.#symbolHeight;

        if (this.#stopping && align <= distance) {
            this.move(align);

            this.#spinning = false;
            this.#stopping = false;

            Ticker.shared.remove(this.tick, this);

            this.emit('stopped');

            return;
        }

        this.move(distance);
    }

    private move(distance: number) {
        for (const symbol of this.#slots) symbol.y += distance;

        let bottom = this.#slots[this.#slots.length - 1];

        // A symbol that slid out under the reel comes back in on top with a
        // new face, which keeps #slots ordered from top to bottom.
        while (bottom.y >= this.#reelHeight) {
            bottom.y = this.#slots[0].y - this.#symbolHeight;
            bottom.randomize();

            this.#slots.pop();
            this.#slots.unshift(bottom);

            bottom = this.#slots[this.#slots.length - 1];
        }
    }
}
