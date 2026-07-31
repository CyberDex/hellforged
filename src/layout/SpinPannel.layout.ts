import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { SpinButton } from './components/SpinButton';

export class SpinPannel extends Layout {
    readonly button: SpinButton;

    constructor() {
        const button = new SpinButton();

        super({
            content: [
                {
                    content: Sprite.from('spinButtonBG'),
                    styles: { position: 'center' },
                },
                {
                    content: button,
                    styles: {
                        position: 'center',
                        marginTop: 36,
                        marginLeft: 41,
                    },
                },
            ],
            styles: {
                position: 'center',
                marginTop: 286,
            },
        });

        this.button = button;
    }
}
