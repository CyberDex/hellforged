import { FillPattern, Texture, TextStyle } from 'pixi.js';

export const FONT_FAMILY = 'PirataOne';

// One tiling fill for all text, set once as the default. The texture is
// loaded on its own rather than packed into the sprite sheet: canvas text
// takes the pattern from the whole image, so a sheet frame would tile the
// sheet.
export function setDefaultTextStyle() {
    TextStyle.defaultTextStyle.fontFamily = FONT_FAMILY;
    TextStyle.defaultTextStyle.fill = new FillPattern({
        texture: Texture.from('textTexture'),
        repetition: 'repeat',
        textureSpace: 'local',
    });
}
