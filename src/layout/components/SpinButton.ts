import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { visuals } from 'config/visual.settings';
import { sound } from 'controllers/sound.controller';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';

const { hoverScale, tweenDuration, rotateDuration } = visuals.spinButton;

export class SpinButton extends FancyButton {
    // Held so a second spin picks the turn up rather than stacking another.
    #turn?: Tween;

    constructor() {
        // `@pixi/ui`'s own animation shape, run by the view swapping.
        const lean = (scale: number) => ({
            props: { scale: { x: scale, y: scale } },
            duration: tweenDuration,
        });

        super({
            defaultView: 'spinButton',
            disabledView: 'spinButtonDisabled',
            anchor: 0.5,
            animations: {
                hover: lean(hoverScale),
                default: lean(1),
                pressed: lean(1),
            },
        });

        this.onDown.connect(() => sound.play('click'));
        this.onPress.connect(() => this.rotate());
    }

    private rotate() {
        this.#turn?.stop();
        this.#turn = tween.run({
            duration: rotateDuration,
            to: Math.PI * 2,
            onUpdate: (rotation) => {
                this.rotation = rotation;
            },
            onComplete: () => {
                this.rotation = 0;
                this.#turn = undefined;
            },
        });
    }
}
