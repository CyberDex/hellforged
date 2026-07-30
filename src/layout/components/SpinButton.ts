import '@pixi/layout';
import { FancyButton } from '@pixi/ui';

export class SpinButton extends FancyButton {
    constructor() {
        super({
            defaultView: 'spin-button',
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
    }
}
