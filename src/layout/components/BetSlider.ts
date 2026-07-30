import { Slider } from '@pixi/ui';
import { Graphics } from 'pixi.js';
import { settings } from 'config/game.settings';
import { sound } from 'controllers/sound.controller';

// The track is drawn to the width of the pannel it sits under, and the handle
// runs from one end of it to the other.
const WIDTH = 120;
const HEIGHT = 3;
const RADIUS = HEIGHT / 2;
const HANDLE = 9;

// Locking the bet cools the metal down rather than fading it out, so the track
// still reads solidly against the pannel for as long as it cannot be moved.
const LIT = { pit: '#7a2f10', ember: '#7a2f10', metal: '#ffca50' };
const COLD = { pit: '#2b2521', ember: '#463b33', metal: '#8b8279' };

type Forge = typeof LIT;

const drawTrack = (g: Graphics, { pit, ember }: Forge) =>
    g
        .clear()
        .roundRect(0, 0, WIDTH, HEIGHT, RADIUS)
        .fill(pit)
        .stroke({ color: ember, width: 2 });

const drawFill = (g: Graphics, { metal }: Forge) =>
    g.clear().roundRect(0, 0, WIDTH, HEIGHT, RADIUS).fill(metal);

const drawHandle = (g: Graphics, { metal }: Forge) =>
    g
        .clear()
        .circle(0, 0, HANDLE)
        .fill(metal)
        .stroke({ color: '#000000', width: 2 });

// The bet is dragged rather than typed: the handle runs the whole range in one
// sweep, and the amount it lands on is read off the pannel above it.
export class BetSlider extends Slider {
    #track: Graphics;
    #fill: Graphics;
    #handle: Graphics;

    constructor() {
        const track = drawTrack(new Graphics(), LIT);
        const fill = drawFill(new Graphics(), LIT);
        const handle = drawHandle(new Graphics(), LIT);

        super({
            bg: track,
            fill,
            slider: handle,
            min: settings.minBet,
            max: settings.maxBet,
            value: settings.defaultBet,
        });

        this.#track = track;
        this.#fill = fill;
        this.#handle = handle;

        // The handle hangs off both ends of the track, so how wide the slider
        // measures depends on where it happens to be sitting. This pins the
        // widest of it down, so a resize always lays the track out in the same
        // place rather than shifting it under the pannel.
        const bounds = new Graphics()
            .rect(-HANDLE, 0, WIDTH + HANDLE * 2, HEIGHT)
            .fill({ color: '#000000', alpha: 0 });

        bounds.eventMode = 'none';
        this.addChildAt(bounds, 0);

        // Only once the handle is let go, so a sweep across the range is one
        // click rather than hundreds.
        this.onChange.connect(() => sound.play('click'));
    }

    // The stake is taken as the reels start, so the bet is held where it was
    // for as long as the spin it paid for is running. Each part is redrawn to
    // the same geometry, which keeps the handle on its mark and the fill inside
    // the mask that cuts it back to the bet.
    set enabled(enabled: boolean) {
        const forge = enabled ? LIT : COLD;

        this.interactiveChildren = enabled;
        drawTrack(this.#track, forge);
        drawFill(this.#fill, forge);
        drawHandle(this.#handle, forge);
    }
}
