import { Container, Rectangle } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import { Reel } from './Reel';

const { reelGap } = visuals.machine;

export class Reels extends Container {
    #reels: Reel[] = [];
    #rowHeight: number;

    constructor(reels: number, rows: number) {
        super();

        for (let i = 0; i < reels; i++) {
            const reel = new Reel(rows);

            reel.x = i * (reel.width + reelGap);

            // Landing is what ends a spin, so it goes up to the controller
            // with the index of the reel that came to rest.
            reel.on('stopped', () => this.emit('stopped', i));

            this.#reels.push(reel);
            this.addChild(reel);
        }

        const [{ width, height }] = this.#reels;

        this.#rowHeight = height / rows;

        // Fixed bounds, so the grid still measures its rows once the window is
        // masking it — otherwise the machine around it is sized by whatever the
        // mask happens to leave showing.
        this.boundsArea = new Rectangle(
            0,
            0,
            reels * width + (reels - 1) * reelGap,
            height,
        );
    }

    // How tall one row of the grid stands, which is the least the window over
    // it can be cropped to — see `SlotMachine`.
    get rowHeight() {
        return this.#rowHeight;
    }

    // The reels always start together; the controller stops them one by one.
    spin() {
        for (const reel of this.#reels) reel.spin();
    }

    // Each reel is handed the column of the outcome it has to land on.
    stop(index: number, symbols: string[]) {
        this.#reels[index]?.stop(symbols);
    }

    // The grid put straight onto an outcome, with no spin: each reel is handed
    // the column it is to show. Columns the grid no longer has are left out of
    // it, so an outcome saved by a game with other reels is not half applied.
    set symbols(symbols: string[][]) {
        this.#reels.forEach((reel, index) => {
            const column = symbols[index];

            if (column) reel.symbols = column;
        });
    }
}
