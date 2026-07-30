import '@pixi/layout';
import { Sprite, Texture } from 'pixi.js';

export class BG extends Sprite {
    constructor() {
        super(Texture.from('bg'));
    }
}
