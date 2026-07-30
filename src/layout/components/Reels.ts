import { Container } from 'pixi.js';
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
    }

    // The reels always start together; the controller stops them one by one.
    spin() {
        for (const reel of this.#reels) reel.spin();
    }

    stop(index: number) {
        this.#reels[index]?.stop();
    }
}
