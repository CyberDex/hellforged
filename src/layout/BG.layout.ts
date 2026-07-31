import '@pixi/layout';
import { Sprite } from 'pixi.js';
import { settingsVisual } from 'config/visual.settings';
import { BurnFilter } from 'filters/burn.filter';
import { graphicsStore } from 'store/graphics.store';
import { Layout } from '@pixi/layout';

export class BG extends Layout {
    #burn?: BurnFilter;

    constructor() {
        super({
            content: Sprite.from('bg'),
            styles: { position: 'center' },
        });

        graphicsStore.subscribe(() => this.shade());
        this.shade();
    }

    // Off takes the filter away rather than turning it down: nothing of the
    // shader runs, and it is built on first ask, so a game opened with it off
    // never even compiles it.
    private shade() {
        if (!graphicsStore.getState().shader) {
            this.filters = [];
            this.#burn?.destroy();
            this.#burn = undefined;

            return;
        }

        this.#burn ??= new BurnFilter(settingsVisual.burn);
        this.filters = [this.#burn];
    }
}
