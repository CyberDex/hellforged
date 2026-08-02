import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { SpinButton } from './components/SpinButton';
import type { SoundPlayer, TweenRunner } from 'controllers/contracts';

export class SpinPannel extends Layout {
    readonly button: SpinButton;

    constructor(sound: SoundPlayer, tween: TweenRunner) {
        const button = new SpinButton(sound, tween);

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
                marginTop: 220,
            },
        });

        this.button = button;
    }
}
