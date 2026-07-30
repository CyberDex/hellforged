import { Container, Rectangle } from 'pixi.js';
import { Reel } from './Reel';

const GAP = 30;

export class Reels extends Container {
    #reels: Reel[] = [];

    constructor(reels: number, rows: number) {
        super();

        for (let i = 0; i < reels; i++) {
            const reel = new Reel(rows);

            reel.x = i * (reel.width + GAP);

            // Landing is what ends a spin, so it goes up to the controller
            // with the index of the reel that came to rest.
            reel.on('stopped', () => this.emit('stopped', i));

            this.#reels.push(reel);
            this.addChild(reel);
        }

        const [{ width, height }] = this.#reels;

        // Fixed bounds, so the grid still measures its rows once the window is
        // masking it — otherwise the machine around it is sized by whatever the
        // mask happens to leave showing.
        this.boundsArea = new Rectangle(
            0,
            0,
            reels * width + (reels - 1) * GAP,
            height,
        );
    }

    // The reels always start together; the controller stops them one by one.
    spin() {
        for (const reel of this.#reels) reel.spin();
    }

    // Each reel is handed the column of the outcome it has to land on.
    stop(index: number, symbols: string[]) {
        this.#reels[index]?.stop(symbols);
    }
}
