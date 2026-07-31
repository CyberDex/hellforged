import '@pixi/layout';
import { Sprite, Texture } from 'pixi.js';
import { BurnFilter } from 'filters/burn.filter';
import { graphicsStore } from 'store/graphics.store';

export class BG extends Sprite {
    #burn?: BurnFilter;

    constructor() {
        super(Texture.from('bg'));

        graphicsStore.subscribe(() => this.shade());
        this.shade();
    }

    // The burn is a pass over the whole of the background on every frame, and the
    // one thing the game draws that a machine can be spared without losing
    // anything it is played with. Off means the filter is taken away rather than
    // turned down: nothing of the shader is run. Built the first time it is asked
    // for, so a game opened with it off never even compiles it.
    private shade() {
        if (!graphicsStore.getState().shader) {
            this.filters = [];

            return;
        }

        this.#burn ??= new BurnFilter(1.5);
        this.filters = [this.#burn];
    }
}
