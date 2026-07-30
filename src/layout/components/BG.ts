import '@pixi/layout';
import { Sprite, Texture } from 'pixi.js';
import { BurnFilter } from '../../filters/burn.filter';

export class BG extends Sprite {
    constructor() {
        super(Texture.from('bg'));

        this.filters = [new BurnFilter(1.5)];
    }
}
