import { Sprite, Texture } from 'pixi.js';
import { getRandomSymbol } from '../../utils/getRandomSymbol';

export class Symbol extends Sprite {
    constructor(symbol?: string) {
        super(Texture.from(symbol || getRandomSymbol()));
    }

    randomize() {
        this.texture = Texture.from(getRandomSymbol());
    }
}
