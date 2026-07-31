import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
import type { SpinButton } from 'layout/components/SpinButton';
import type { BetSlider } from 'layout/components/BetSlider';
import { SpinPannel } from 'layout/components/SpinPannel';
import { BetPannel } from 'layout/components/BetPannel';
import { WinPannel } from 'layout/components/WinPannel';
import { Reels } from 'layout/components/Reels';
import { SlotMachine } from 'layout/components/SlotMachine';
import { settings } from 'config/game.settings';
import { definition } from 'config/game.definition';
import { BG } from 'layout/components/BG';
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

    // Everything but the background, zoomed as one.
    readonly #ui: Layout;
    // Kept so a resize can put the zoom back.
    #zoom = 1;
    #growing?: Tween;

    constructor() {
        setDefaultTextStyle();

        const bg = new BG();
        const buttonSpin = new SpinPannel();
        const betPannel = new BetPannel();
        const winPannel = new WinPannel();
        const reels = new Reels(definition.strips, definition.rows);
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
        this.spinButton = buttonSpin.button;
        this.betSlider = betPannel.slider;
        this.betPannel = betPannel;
        this.winPannel = winPannel;
        this.reels = reels;
        this.slotMachine = slotMachine;
        this.winLayout = winLayout;
        this.#ui = this.getChildByID('ui') as Layout;

        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    // this is the only place whole layout needs to listen for resize,
    // all the magic happends inside of it basing on configs
    private onResize() {
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
