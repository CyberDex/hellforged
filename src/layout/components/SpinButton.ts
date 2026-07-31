import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { Ticker } from 'pixi.js';
import { sound } from 'controllers/sound.controller';

export class SpinButton extends FancyButton {
    constructor() {
        super({
            defaultView: 'spinButton',
            disabledView: 'spinButtonDisabled',
            anchor: 0.5,
            animations: {
                hover: {
                    props: {
                        scale: {
                            x: 1.1,
                            y: 1.1,
                        },
                    },
                    duration: 100,
                },
                default: {
                    props: {
                        scale: {
                            x: 1,
                            y: 1,
                        },
                    },
                    duration: 100,
                },
                pressed: {
                    props: {
                        scale: {
                            x: 1,
                            y: 1,
                        },
                    },
                    duration: 100,
                },
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
        const duration = 200;

        const tick = ({ deltaMS }: Ticker) => {
            this.rotation += (fullTurn * deltaMS) / duration;
            if (this.rotation < fullTurn) return;

            this.rotation = 0;
            Ticker.shared.remove(tick);
        };

        Ticker.shared.add(tick);
    }
}
