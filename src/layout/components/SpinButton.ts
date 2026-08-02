import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { settingsVisual } from 'config/visual.settings';
import type { SoundPlayer, Tween, TweenRunner } from 'controllers/contracts';

const { hoverScale, tweenDuration, rotateDuration } = settingsVisual.spinButton;

export class SpinButton extends FancyButton {
    readonly #sound: SoundPlayer;
    readonly #tween: TweenRunner;
    // Held so a second spin picks the turn up rather than stacking another.
    #turn?: Tween;

    constructor(sound: SoundPlayer, tween: TweenRunner) {
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

        this.#sound = sound;
        this.#tween = tween;

        this.onDown.connect(() => this.#sound.play('click'));
        this.onPress.connect(() => this.rotate());
    }

    private rotate() {
        this.#turn?.stop();
        this.#turn = this.#tween.run({
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
