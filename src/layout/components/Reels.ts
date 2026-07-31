import { Container, Rectangle } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import { Reel } from './Reel';
import type { Position } from 'engine/engine';

const { reelGap } = visuals.machine;

export class Reels extends Container {
    readonly #reels: Reel[] = [];
    readonly #rowHeight: number;

    constructor(strips: string[][], rows: number) {
        super();

        strips.forEach((strip, i) => {
            const reel = new Reel(rows, strip);

            reel.x = i * (reel.width + reelGap);

            reel.on('stopped', () => this.emit('stopped', i));

            this.#reels.push(reel);
            this.addChild(reel);
        });

        const [{ width, height }] = this.#reels;

        this.#rowHeight = height / rows;

        // Fixed bounds, so the grid still measures its rows once the window
        // is masking it.
        this.boundsArea = new Rectangle(
            0,
            0,
            strips.length * width + (strips.length - 1) * reelGap,
            height,
        );
    }

    get rowHeight() {
        return this.#rowHeight;
    }

    spin() {
        for (const reel of this.#reels) reel.spin();
    }

    highlight(positions: Position[] | null) {
        this.#reels.forEach((reel, index) => {
            reel.highlight(
                positions &&
                    positions
                        .filter(([column]) => column === index)
                        .map(([, row]) => row),
            );
        });
    }

    stop(index: number, symbols: string[]) {
        this.#reels[index]?.stop(symbols);
    }

    // Columns the grid no longer has are left out, so an outcome saved by a
    // game with other reels is not half applied.
    set symbols(symbols: string[][]) {
        this.#reels.forEach((reel, index) => {
            const column = symbols[index];

            if (column) reel.symbols = column;
        });
    }
}
