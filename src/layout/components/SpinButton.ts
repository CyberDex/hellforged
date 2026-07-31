import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { visuals } from 'config/visual.settings';
import { sound } from 'controllers/sound.controller';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';

const { hoverScale, tweenDuration, rotateDuration } = visuals.spinButton;

export class SpinButton extends FancyButton {
    // The turn a spin sets going, held so a second spin picks the button up
    // where it is rather than sending another turn round on top of it.
    #turn?: Tween;

    constructor() {
        // Out under the pointer and back to size as it leaves or presses, so
        // the three states are the one movement, taken at the one pace. This
        // one is `@pixi/ui`'s own rather than the game's: it is the view
        // swapping that runs it, and nothing here starts it.
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
    }

    // Pressed by something that is not a pointer, which is the space bar (see
    // `keyboard.controller.ts`). The click is sounded here, since `onDown` is a
    // finger's alone, and the press itself goes out as the signal a click sends,
    // so whatever answers it cannot tell the two apart.
    press() {
        sound.play('click');
        this.onPress.emit();
    }

    rotate() {
        this.#turn?.stop();
        this.#turn = tween.run({
            duration: rotateDuration,
            to: Math.PI * 2,
            onUpdate: (rotation) => {
                this.rotation = rotation;
            },
            // Round is where it started, so it is put back there rather than
            // left standing a whole turn on.
            onComplete: () => {
                this.rotation = 0;
                this.#turn = undefined;
            },
        });
    }
}
