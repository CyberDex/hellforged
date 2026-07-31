import { Slider } from '@pixi/ui';
import { Graphics } from 'pixi.js';
import { gmeSettings } from 'config/game.settings';
import { settingsVisual } from 'config/visual.settings';
import { sound } from 'controllers/sound.controller';

const { width, height, handle, pit, metal, outline, outlineWidth } =
    settingsVisual.betSlider;
const radius = height / 2;

export class BetSlider extends Slider {
    constructor() {
        super({
            bg: new Graphics()
                .roundRect(0, 0, width, height, radius)
                .fill(pit)
                .stroke({ color: pit, width: outlineWidth }),
            fill: new Graphics()
                .roundRect(0, 0, width, height, radius)
                .fill(metal),
            slider: new Graphics()
                .circle(0, 0, handle)
                .fill(metal)
                .stroke({ color: outline, width: outlineWidth }),
            min: gmeSettings.minBet,
            max: gmeSettings.maxBet,
            value: gmeSettings.defaultBet,
        });

        // The handle hangs off both ends, so measured width depends on where
        // it sits; pinning the widest keeps a resize from shifting the track.
        const bounds = new Graphics()
            .rect(-handle, 0, width + handle * 2, height)
            .fill({ color: outline, alpha: 0 });

        bounds.eventMode = 'none';
        this.addChildAt(bounds, 0);

        // Only under the finger: `onUpdate` also fires when the game itself
        // places or caps the handle.
        this.onUpdate.connect(() => {
            if (this.dragging) sound.play('coin');
        });
    }

    nudge(steps: number) {
        const bet = this.value;

        this.value += steps * this.step;

        // A handle already at the end it was sent to passed no figure.
        if (this.value !== bet) sound.play('coin');
    }

    // Hidden rather than greyed, which also takes it out of hit testing.
    set enabled(enabled: boolean) {
        this.visible = enabled;
    }
}
