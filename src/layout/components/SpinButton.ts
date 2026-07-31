import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { Ticker } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import { sound } from 'controllers/sound.controller';

const { hoverScale, tweenDuration, rotateDuration } = visuals.spinButton;

export class SpinButton extends FancyButton {
    constructor() {
        // Out under the pointer and back to size as it leaves or presses, so
        // the three states are the one movement, taken at the one pace.
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
        const fullTurn = Math.PI * 2;

        const tick = ({ deltaMS }: Ticker) => {
            this.rotation += (fullTurn * deltaMS) / rotateDuration;
            if (this.rotation < fullTurn) return;

            this.rotation = 0;
            Ticker.shared.remove(tick);
        };

        Ticker.shared.add(tick);
    }
}
