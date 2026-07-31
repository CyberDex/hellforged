import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
import type { SpinButton } from 'layout/components/SpinButton';
import type { BetSlider } from 'layout/components/BetSlider';
import { SpinPannel } from 'layout/SpinPannel.layout';
import { BetPannel } from 'layout/BetPannel.layout';
import { WinPannel } from 'layout/WinPannel.layout';
import { Reels } from 'layout/components/Reels';
import { SlotMachine } from 'layout/SlotMachine.layout';
import { gmeSettings } from 'config/game.settings';
import { gameDefinition } from 'config/game.definition';
import { BG } from 'layout/BG.layout';
import { WinLayout } from 'layout/Win.layout';
import { setDefaultTextStyle } from 'config/font.settings';

export class RootLayout extends Layout {
    readonly bg: BG;
    readonly spinButton: SpinButton;
    readonly betSlider: BetSlider;
    readonly betPannel: BetPannel;
    readonly winPannel: WinPannel;
    readonly reels: Reels;
    readonly slotMachine: SlotMachine;
    readonly winLayout: WinLayout;

    // Kept so a resize can put the zoom back.
    #zoom = 1;
    #growing?: Tween;

    constructor() {
        setDefaultTextStyle();

        const bg = new BG();
        const buttonSpin = new SpinPannel();
        const betPannel = new BetPannel();
        const winPannel = new WinPannel();
        const reels = new Reels(gameDefinition.strips, gameDefinition.rows);
        const slotMachine = new SlotMachine(reels);
        const winLayout = new WinLayout();

        super({
            content: {
                id: 'content',
                content: {
                    bg,
                    ui: {
                        content: {
                            slotMachine,
                            buttonSpin,
                            betPannel,
                            winPannel,
                            // Last, so it draws over the reels.
                            win: winLayout,
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
                    minHeight: 740,
                    minWidth: 800,
                    aspectRatio: 'flex',
                },
            },
            styles: {
                width: '100%',
                height: '100%',
            },
        });

        this.bg = bg;
        this.spinButton = buttonSpin.button;
        this.betSlider = betPannel.slider;
        this.betPannel = betPannel;
        this.winPannel = winPannel;
        this.reels = reels;
        this.slotMachine = slotMachine;
        this.winLayout = winLayout;

        // this is the only place where pixiLayout needs to listen for resize,
        // all the magic happends inside of it basing on configs
        window.addEventListener('resize', () =>
            this.resize(window.innerWidth, window.innerHeight),
        );
        this.resize(window.innerWidth, window.innerHeight);
    }

    zoom(duration: number) {
        this.#growing?.stop();
        this.#growing = tween.run({
            duration,
            from: 1,
            to: gmeSettings.anticipationZoom,
            onUpdate: (zoom) => {
                this.#zoom = zoom;
            },
        });
    }

    // Says whether there was a zoom to come down from: the drop back is heard.
    unzoom() {
        this.#growing?.stop();
        this.#growing = undefined;

        const zoomed = this.#zoom !== 1;

        this.#zoom = 1;

        return zoomed;
    }
}
