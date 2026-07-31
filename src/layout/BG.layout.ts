import '@pixi/layout';
import { Sprite } from 'pixi.js';
import { settingsVisual } from 'config/visual.settings';
import { BurnFilter } from 'filters/burn.filter';
import { Layout } from '@pixi/layout';
import type { StoreApi } from 'zustand/vanilla';
import type { GraphicsStore } from 'store/graphics.store';

export class BG extends Layout {
    readonly #store: StoreApi<GraphicsStore>;
    #burn?: BurnFilter;

    constructor(store: StoreApi<GraphicsStore>) {
        super({
            content: Sprite.from('bg'),
            styles: { position: 'center' },
        });

        this.#store = store;
        this.#store.subscribe(() => this.shade());
        this.shade();
    }

    // Off takes the filter away rather than turning it down: nothing of the
    // shader runs, and it is built on first ask, so a game opened with it off
    // never even compiles it.
    private shade() {
        if (!this.#store.getState().shader) {
            this.filters = [];
            this.#burn?.destroy();
            this.#burn = undefined;

            return;
        }

        this.#burn ??= new BurnFilter(settingsVisual.burn);
        this.filters = [this.#burn];
    }
}
