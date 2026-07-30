import { FillPattern, Texture, TextStyle } from 'pixi.js';

export const FONT_FAMILY = 'PirataOne';

// Every piece of text in the game is filled with the same tiling texture rather
// than a flat colour, so it is set once as the default and nothing carries its
// own fill. Canvas text takes the pattern from the whole image behind the
// texture, so this one is loaded on its own rather than packed into the sprite
// sheet — a sheet frame would tile the sheet.
export function setDefaultTextStyle() {
    TextStyle.defaultTextStyle.fontFamily = FONT_FAMILY;
    TextStyle.defaultTextStyle.fill = new FillPattern({
        texture: Texture.from('texture'),
        repetition: 'repeat',
        textureSpace: 'local',
    });
}
