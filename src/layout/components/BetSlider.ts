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

// The pit the bet is dragged along, and the hot metal marking how far it is up.
const PIT = '#7a2f10';
const METAL = '#ffca50';

// The bet is dragged rather than typed: the handle runs the whole range in one
// sweep, and the amount it lands on is read off the pannel above it.
export class BetSlider extends Slider {
    constructor() {
        super({
            // Stroked in its own colour, which reads as a slightly thicker
            // track rather than as an edge around it.
            bg: new Graphics()
                .roundRect(0, 0, WIDTH, HEIGHT, RADIUS)
                .fill(PIT)
                .stroke({ color: PIT, width: 2 }),
            fill: new Graphics()
                .roundRect(0, 0, WIDTH, HEIGHT, RADIUS)
                .fill(METAL),
            slider: new Graphics()
                .circle(0, 0, HANDLE)
                .fill(METAL)
                .stroke({ color: '#000000', width: 2 }),
            // The top end is only the widest the slider ever opens: the game
            // brings it down to the balance whenever that no longer covers a
            // bet staked this high.
            min: settings.minBet,
            max: settings.maxBet,
            value: settings.defaultBet,
        });

        // The handle hangs off both ends of the track, so how wide the slider
        // measures depends on where it happens to be sitting. This pins the
        // widest of it down, so a resize always lays the track out in the same
        // place rather than shifting it under the pannel.
        const bounds = new Graphics()
            .rect(-HANDLE, 0, WIDTH + HANDLE * 2, HEIGHT)
            .fill({ color: '#000000', alpha: 0 });

        bounds.eventMode = 'none';
        this.addChildAt(bounds, 0);

        // A coin for every figure the bet passes through, so a sweep is heard
        // being counted out the way the win is, rather than landing as one
        // click when the handle is let go. Only under the player's finger:
        // `onUpdate` also fires when the game itself moves the handle, and
        // placing it or capping it to the balance is not money being staked.
        this.onUpdate.connect(() => {
            if (this.dragging) sound.play('coin');
        });
    }

    // A bet there is no setting of is taken off the machine rather than left
    // sitting there unanswering: the stake for a running spin has already been
    // taken, and a balance that is out has nothing to stake either way. The
    // pannel above stays up and keeps reading the bet out, so what the spin
    // was paid for is still there while the handle that set it is away. Hidden
    // also takes the slider out of hit testing, so there is nothing left to
    // drag rather than something that quietly refuses.
    set enabled(enabled: boolean) {
        this.visible = enabled;
    }
}
