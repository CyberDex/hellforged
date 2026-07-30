import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { SpinButton } from './components/SpinButton';
import { Pannel } from './components/Pannel';
import { Reels } from './components/Reels';
import { settings } from '../config/game.settings';

export class RootLayout extends Layout {
    spinButton: SpinButton;
    betPannel: Pannel;
    winPannel: Pannel;
    reels: Reels;

    constructor() {
        const spinButton = new SpinButton();
        const betPannel = new Pannel('Bet');
        const winPannel = new Pannel('Win');
        const mask = Sprite.from('mask');
        const reels = new Reels(settings.reels, settings.rows);

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
                                content: spinButton,
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
                        content: betPannel,
                        styles: {
                            position: 'center',
                            marginTop: 210,
                            marginLeft: -155,
                        },
                    },
                    winPannel: {
                        content: winPannel,
                        styles: {
                            position: 'center',
                            marginTop: 210,
                            marginLeft: 155,
                        },
                    },
                    reels: {
                        content: reels,
                        styles: {
                            position: 'center',
                            marginTop: -15,
                            marginLeft: 0,
                        },
                    },
                    mask: {
                        content: mask,
                        styles: {
                            position: 'center',
                            marginTop: 32,
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

        this.spinButton = spinButton;
        this.betPannel = betPannel;
        this.winPannel = winPannel;
        this.reels = reels;

        this.reels.mask = mask;

        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    onResize() {
        this.resize(window.innerWidth, window.innerHeight);
    }
}
