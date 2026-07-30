import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { SpinButton } from './components/SpinButton';

export class RootLayout extends Layout {
    constructor() {
        super({
            content: {
                id: 'content',
                content: {
                    bg: {
                        content: Sprite.from('bg'),
                        styles: { position: 'center' },
                    },
                    buttonSpin: {
                        content: new SpinButton(),
                        styles: {
                            position: 'center',
                            marginTop: 270,
                            marginLeft: 55,
                        },
                    },
                },
                styles: {
                    position: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: 600,
                    minWidth: 500,
                    aspectRatio: 'flex',
                },
            },
            styles: {
                width: '100%',
                height: '100%',
            },
        });

        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    onResize() {
        this.resize(window.innerWidth, window.innerHeight);
    }
}
