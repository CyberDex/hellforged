import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
import { SpinButton } from 'layout/components/SpinButton';
import { BetSlider } from 'layout/components/BetSlider';
import { Pannel } from 'layout/components/Pannel';
import { Reels } from 'layout/components/Reels';
import { SlotMachine } from 'layout/components/SlotMachine';
import { settings } from 'config/game.settings';
import { definition } from 'config/game.definition';
import { BG } from 'layout/components/BG';
import { WinLayout } from 'layout/Win.layout';
import { setDefaultTextStyle } from 'config/font.settings';

export class RootLayout extends Layout {
    bg: BG;
    spinButton: SpinButton;
    betSlider: BetSlider;
    betPannel: Pannel;
    winPannel: Pannel;
    reels: Reels;
    slotMachine: SlotMachine;
    winLayout: WinLayout;

    // Everything but the background, zoomed as one.
    #ui: Layout;
    // Kept so a resize can put the zoom back.
    #zoom = 1;
    #growing?: Tween;

    constructor() {
        setDefaultTextStyle();

        const bg = new BG();
        const spinButton = new SpinButton();
        const betSlider = new BetSlider();
        const betPannel = new Pannel('Bet');
        const winPannel = new Pannel('Win');
        const reels = new Reels(definition.strips, definition.rows);
        const slotMachine = new SlotMachine(
            Sprite.from('reels'),
            reels,
            Sprite.from('mask'),
        );
        const winLayout = new WinLayout();

        super({
            content: {
                id: 'content',
                content: {
                    bg: {
                        content: bg,
                        styles: { position: 'center' },
                    },
                    ui: {
                        content: {
                            slotMachine: {
                                content: slotMachine,
                                styles: {
                                    position: 'center',
                                    // The grid is all the machine measures;
                                    // cabinet and window are larger.
                                    width: slotMachine.width,
                                    height: slotMachine.height,
                                    marginTop: slotMachine.offset,
                                },
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
                                content: [
                                    {
                                        content: betPannel,
                                        styles: { position: 'center' },
                                    },
                                    {
                                        content: betSlider,
                                        styles: {
                                            position: 'center',
                                            marginTop: 35,
                                            marginLeft: 10,
                                        },
                                    },
                                ],
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
                            // Last, so it draws over the reels.
                            win: {
                                content: winLayout,
                                styles: {
                                    position: 'center',
                                    marginTop: -15,
                                },
                            },
                        },
                        styles: {
                            position: 'center',
                            width: '100%',
                            height: '100%',
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

        this.bg = bg;
        this.spinButton = spinButton;
        this.betSlider = betSlider;
        this.betPannel = betPannel;
        this.winPannel = winPannel;
        this.reels = reels;
        this.slotMachine = slotMachine;
        this.winLayout = winLayout;
        this.#ui = this.getChildByID('ui') as Layout;

        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    onResize() {
        this.resize(window.innerWidth, window.innerHeight);

        // The layout writes its own scale as it lays out; the zoom goes back
        // over the top of it.
        this.#ui.origin.set(this.#ui.width / 2, this.#ui.height / 2);
        this.#ui.scale.set(this.#zoom);
    }

    zoom(duration: number) {
        this.#growing?.stop();
        this.#growing = tween.run({
            duration,
            from: 1,
            to: settings.anticipationZoom,
            onUpdate: (zoom) => {
                this.#zoom = zoom;
                this.#ui.scale.set(zoom);
            },
        });
    }

    // Says whether there was a zoom to come down from: the drop back is heard.
    unzoom() {
        this.#growing?.stop();
        this.#growing = undefined;

        const zoomed = this.#zoom !== 1;

        this.#zoom = 1;
        this.#ui.scale.set(this.#zoom);

        return zoomed;
    }
}
