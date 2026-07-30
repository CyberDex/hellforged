import type { GlRenderingContext, WebGLRenderer } from 'pixi.js';
import { Pane } from 'tweakpane';
import { gameName } from 'config/game.name';
import { settings } from 'config/game.settings';
import { gameStore } from 'store/game.store';
import { app } from './app.controller';
import { game } from './game.controller';

// Every draw Pixi makes leaves through one of these four calls on the context —
// the batcher, the masks and the filters all end up here — so wrapping them
// counts the lot without the renderer having to be asked.
const draws = [
    'drawArrays',
    'drawElements',
    'drawArraysInstanced',
    'drawElementsInstanced',
] as const;

// What the graph is scaled to. Fixed rather than grown to fit the worst frame
// so far, so the same spike is the same height every time it happens. The game
// runs between six and ten a frame as it stands, which this leaves sitting
// around the middle with room above it for whatever a new scene costs.
const maxDrawCalls = 20;

// What the panel is given while it is open: enough for the graph and for a
// cheat button to read its payout out on one line.
const paneWidth = '260px';

// Where the panel keeps what it was left with open, under the game's name the
// way everything else kept in the browser is — see `game.name.ts`. Its own keys
// rather than a store in `src/store`: those are the player's and are built, and
// this is neither.
const foldKey = `${gameName}.devTools`;

// The parts that open and shut, each remembered on its own.
type Fold = 'pane' | 'cheats';

// The panel the game is watched from while it is being worked on. Mounted only
// in dev, and loaded that way too, so none of this reaches the player — see
// `main.ts`. Tweakpane's own docs: https://tweakpane.github.io/docs/
class DevToolsController {
    // What the pane is bound to and reads: the last frame's total, settled, so
    // the graph is never handed a frame that is still being drawn.
    readonly #stats = { drawCalls: 0 };
    #calls = 0;

    init() {
        const container = this.container();
        const pane = new Pane({
            container,
            title: 'Dev tools',
            expanded: this.expanded('pane'),
        });

        this.fold(pane, container);
        this.drawCalls(pane);
        this.cheats(pane);
    }

    // Shut, the panel is its title bar and nothing else, so the box it hangs in
    // is let off the width the readouts need and left to shrink onto that bar.
    // The rest of the corner goes back to the game rather than staying under a
    // strip of panel that has nothing on it. Set on the way in as well as on the
    // fold, since a panel that opens shut is never folded to get there.
    private fold(pane: Pane, container: HTMLElement) {
        const fit = (expanded: boolean) => {
            container.style.width = expanded ? paneWidth : 'fit-content';
        };

        fit(pane.expanded);

        pane.on('fold', ({ expanded }) => {
            this.remember('pane', expanded);

            fit(expanded);
        });
    }

    // Open unless it was last left shut, so a panel nobody has touched is up and
    // reading rather than waiting to be found.
    private expanded(fold: Fold) {
        return localStorage.getItem(`${foldKey}.${fold}`) !== 'false';
    }

    private remember(fold: Fold, expanded: boolean) {
        localStorage.setItem(`${foldKey}.${fold}`, String(expanded));
    }

    private drawCalls(pane: Pane) {
        const { gl } = app.renderer as WebGLRenderer;

        // Nothing to count on WebGPU, which draws through no GL context. The
        // rest of the pane is no business of the renderer's and still goes up.
        if (!gl) return;

        this.tally(gl);

        // The pane samples on a timer of its own by default, which would read
        // the same frame twice or miss one; zero hands the timing over to the
        // refresh below, so both readings are one point per frame.
        //
        // The figure is read out over the graph: the graph is the shape a frame
        // costs, the number is what it actually cost.
        pane.addBinding(this.#stats, 'drawCalls', {
            readonly: true,
            label: 'draw calls',
            // A count, so it is read out as one rather than to two decimals.
            format: (value) => value.toFixed(0),
            interval: 0,
        });

        pane.addBinding(this.#stats, 'drawCalls', {
            readonly: true,
            view: 'graph',
            // Named by the figure above it, which it is the history of.
            label: '',
            min: 0,
            max: maxDrawCalls,
            interval: 0,
        });

        // Ahead of the render, which the app runs at a lower priority: whatever
        // has built up by now is the frame just gone, whole.
        app.ticker.add(() => {
            this.#stats.drawCalls = this.#calls;
            this.#calls = 0;

            pane.refresh();
        });
    }

    // A spin per paying combination the game has, so none of them has to be
    // waited on to be looked at: for every symbol, the pair it pays flat and
    // the three of a kind it pays on its own. Each button spins the machine for
    // real — it only says what the reels have to land on.
    private cheats(pane: Pane) {
        const folder = pane.addFolder({
            title: 'Cheats',
            expanded: this.expanded('cheats'),
        });

        folder.on('fold', ({ expanded }) => this.remember('cheats', expanded));

        for (const symbol of settings.symbols) {
            const { two, three } = settings.payouts;

            folder
                .addButton({ label: symbol, title: `two ×${two}` })
                .on('click', () => game.cheat(this.payline(symbol, 2)));

            folder
                .addButton({ label: symbol, title: `three ×${three[symbol]}` })
                .on('click', () => game.cheat(this.payline(symbol, 3)));
        }

        // The buttons press the machine's own, so they go dead wherever it
        // does: over a spin and its reveal, and on a balance that is out.
        const follow = () => (folder.disabled = !game.canSpin);

        follow();
        gameStore.subscribe(follow);
    }

    // The payline a cheat lands: the first `count` reels on the symbol, and any
    // reel left over deliberately off it, since a pair only pays as a pair
    // while the reel after it misses.
    private payline(symbol: string, count: number) {
        const { symbols } = settings;
        const miss = symbols[(symbols.indexOf(symbol) + 1) % symbols.length];

        return Array.from({ length: settings.reels }, (_, reel) =>
            reel < count ? symbol : miss,
        );
    }

    private tally(gl: GlRenderingContext) {
        for (const call of draws) {
            const draw = gl[call].bind(gl) as (...args: unknown[]) => void;

            gl[call] = (...args: unknown[]) => {
                this.#calls++;

                draw(...args);
            };
        }
    }

    // The pane is hung off the page itself rather than left where Tweakpane
    // puts it, so it sits over the React overlay: that covers the whole canvas
    // on a layer of its own (`ui.css`) and would otherwise paint across it.
    private container() {
        const container = document.createElement('div');

        // Width is left to the fold: it is what the panel is open or shut.
        container.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2';

        document.body.appendChild(container);

        return container;
    }
}

export const devTools = new DevToolsController();
