import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { Ticker } from 'pixi.js';
import { sound } from '../../controllers/sound.controller';

export class SpinButton extends FancyButton {
    private spinning = false;

    constructor() {
        super({
            defaultView: 'spinButton',
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
        this.onPress.connect(() => this.spin());
    }

    private spin() {
        if (this.spinning) return;
        this.spinning = true;

        const fullTurn = Math.PI * 2;
        const duration = 200;

        const tick = ({ deltaMS }: Ticker) => {
            this.rotation += (fullTurn * deltaMS) / duration;
            if (this.rotation < fullTurn) return;

            this.rotation = 0;
            this.spinning = false;
            Ticker.shared.remove(tick);
        };

        Ticker.shared.add(tick);
    }
}
