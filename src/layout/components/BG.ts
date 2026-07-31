import '@pixi/layout';
import { Sprite, Texture } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import { BurnFilter } from 'filters/burn.filter';
import { graphicsStore } from 'store/graphics.store';

export class BG extends Sprite {
    #burn?: BurnFilter;

    constructor() {
        super(Texture.from('bg'));

        graphicsStore.subscribe(() => this.shade());
        this.shade();
    }

    // Off takes the filter away rather than turning it down: nothing of the
    // shader runs, and it is built on first ask, so a game opened with it off
    // never even compiles it.
    private shade() {
        if (!graphicsStore.getState().shader) {
            this.filters = [];

            return;
        }

        this.#burn ??= new BurnFilter(visuals.burn);
        this.filters = [this.#burn];
    }
}
