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

    // Everything the game is played on, which is everything but the background:
    // it is laid out over the whole screen and zoomed as one.
    #ui: Layout;
    // How far the UI is currently zoomed in, kept so a resize can put it back.
    #zoom = 1;
    // The lean in, while it is still going out, so it can be dropped part way.
    #growing?: Tween;

    constructor() {
        setDefaultTextStyle();

        const bg = new BG();
        const spinButton = new SpinButton();
        const betSlider = new BetSlider();
        const betPannel = new Pannel('Bet');
        const winPannel = new Pannel('Win');
        const reels = new Reels(settings.reels, settings.rows);
        // The cabinet, the reels and the window they are cropped to are placed
        // as one, so nothing has to keep the three of them lined up.
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
                                    // The grid, which is all the machine
                                    // measures: the cabinet around it and the
                                    // window it is cropped to are both larger,
                                    // and neither may place it.
                                    width: slotMachine.width,
                                    height: slotMachine.height,
                                    // The grid sits this far below the middle,
                                    // which leaves the cabinet centred on it.
                                    // The machine works it out, since it is the
                                    // one that knows how far its art was
                                    // stretched to reach the grid.
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
                                    // Under the pannel that reads the bet out,
                                    // so the amount and what sets it are the
                                    // one thing and move together.
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
                            // Over the reels, on the payline, and last so it
                            // draws on top of them.
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

        // A zoom grows the UI about the middle of the screen it has just been
        // laid out on, so the game leans in without leaving its place. The
        // layout writes its own scale as it lays out, so a zoom already in hand
        // goes back over the top of it.
        this.#ui.origin.set(this.#ui.width / 2, this.#ui.height / 2);
        this.#ui.scale.set(this.#zoom);
    }

    // The game fills more of the screen as it grows, evenly over the given
    // time, and stays at full size until it is put back. The background is left
    // out of it and holds the screen still behind the zoom.
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

    // Straight back to size, with none of the travel the zoom had. Says whether
    // there was a zoom to come down from, since dropping back to size is a move
    // the game makes and is heard, while a spin that never leaned in is not.
    unzoom() {
        this.#growing?.stop();
        this.#growing = undefined;

        const zoomed = this.#zoom !== 1;

        this.#zoom = 1;
        this.#ui.scale.set(this.#zoom);

        return zoomed;
    }
}
