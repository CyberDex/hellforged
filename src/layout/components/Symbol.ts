import { Sprite, Texture } from 'pixi.js';

export class Symbol extends Sprite {
    // A symbol is always told its first face: which faces there are to wear is
    // the definition's business, not this sprite's.
    constructor(symbol: string) {
        super(Texture.from(symbol));
    }

    // A symbol keeps its slot on the reel for good and only swaps its face.
    set symbol(symbol: string) {
        this.texture = Texture.from(symbol);
    }
}
