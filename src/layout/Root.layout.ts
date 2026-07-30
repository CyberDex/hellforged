import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { SpinButton } from './components/SpinButton';
import { Pannel } from './components/Pannel';

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
                        content: [
                            {
                                content: Sprite.from('spinButtonBG'),
                                styles: {
                                    position: 'center',
                                },
                            },
                            {
                                content: new SpinButton(),
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
                            marginLeft: 0,
                        },
                    },
                    betPannel: {
                        content: new Pannel('Bet'),
                        styles: {
                            position: 'center',
                            marginTop: 210,
                            marginLeft: -155,
                        },
                    },
                    winPannel: {
                        content: new Pannel('Win'),
                        styles: {
                            position: 'center',
                            marginTop: 210,
                            marginLeft: 155,
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
