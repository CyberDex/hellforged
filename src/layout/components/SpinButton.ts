import '@pixi/layout';
import { FancyButton } from '@pixi/ui';
import { sound } from '../../controllers/sound.controller';

export class SpinButton extends FancyButton {
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
    }
}
