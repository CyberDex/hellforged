import type { GlRenderingContext, WebGLRenderer } from 'pixi.js';
import { Pane } from 'tweakpane';
import { gameName } from 'config/game.name';
import { definition, symbols } from 'config/game.definition';
import { rollGrid } from 'engine/engine';
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

// What the panel is given while it is open. Nothing in it is labelled from the
// side any more, so the graph and the buttons each have the whole of this and
// it is down to what the longest button has to say — a symbol, a count and a
// multiplier — with room left for the graph to be a shape rather than a spike.
const paneWidth = '180px';

// What the panel is called: the count, which is all the title bar has to say —
// see `retitle`.
const title = (drawCalls: number) => `DC: ${drawCalls}`;

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
            title: title(0),
            expanded: this.expanded('pane'),
        });

        this.fold(pane, container);
        this.drawCalls(pane);
        this.cheats(pane);
    }

    // Shut, the panel is its title bar and nothing else, so the box it hangs in
    // is let off the width the graph needs and left to shrink onto that bar.
    // The rest of the corner goes back to the game rather than staying behind a
    // strip of panel that has nothing on it. Set on the way in as well as on the
    // fold, since a panel that opens shut is never folded to get there.
    //
    // Shrinking onto the bar has to wait for the fold, and it is the pane that
    // decides when that is done: it folds on a height of its own and only takes
    // the folded contents out of the layout once that has run. Until then they
    // are still there to be measured, and asking them what they want is asking
    // the graph, which is an SVG left at a width of 100% — a percentage of a box
    // that is asking it how wide to be, so it is no width at all and the SVG
    // falls back to the 300px any SVG defaults to. Hence the cap the container
    // is under: measured or not, it can want no more than the width it has open,
    // so the panel holds that width for the fold and shrinks once, onto the bar,
    // as the contents leave. Without it the panel bulges past its open width on
    // the way down and snaps back at the end.
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

        // The shape of the last few seconds, and nothing more: what the frame
        // just gone cost is on the title bar already, where it is readable with
        // the panel shut too, so a figure in the pane as well would only be the
        // same number twice — see `retitle`.
        //
        // Unlabelled, since the title bar names it, and that leaves the graph
        // the whole width of the pane rather than the two thirds a label column
        // would leave it. Said as an empty label rather than by leaving the
        // label out: left out, Tweakpane falls back to naming a binding after
        // the property behind it, and the graph goes up as `drawCalls`.
        //
        // The pane samples on a timer of its own by default, which would read
        // the same frame twice or miss one; zero hands the timing over to the
        // refresh below, so the graph is one point per frame.
        pane.addBinding(this.#stats, 'drawCalls', {
            readonly: true,
            view: 'graph',
            label: undefined,
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
            this.retitle(pane);
        });
    }

    // Shut, the graph folds away with the rest of the panel, and the one figure
    // worth having an eye on the whole time would go with it. So the title bar
    // carries it instead, and carries nothing else: the panel has one name to
    // give and this is more use than it. Labelled, since a bare figure on a
    // title bar says nothing about what it is counting.
    //
    // Every frame, but only ever as dear as it looks: Tweakpane drops a title
    // it is already showing, so the DOM is touched on the frames the count
    // actually moves and no others.
    private retitle(pane: Pane) {
        pane.title = title(this.#stats.drawCalls);
    }

    // A spin per paying combination the game has, so none of them has to be
    // waited on to be looked at: for every symbol, every run of it the paytable
    // pays for. Each button spins the machine for real — it only says what the
    // reels have to land on.
    //
    // The symbol is written into the button rather than sat beside it in a
    // label: a label of its own would cost every row a column the buttons then
    // have to share, and the panel the width of it, to say in two places what
    // reads perfectly well as one line.
    private cheats(pane: Pane) {
        const folder = pane.addFolder({
            title: 'Cheats',
            expanded: this.expanded('cheats'),
        });

        folder.on('fold', ({ expanded }) => this.remember('cheats', expanded));

        for (const symbol of symbols) {
            for (const { count, payout } of this.wins(symbol)) {
                folder
                    .addButton({ title: `${symbol} ${count} ×${payout}` })
                    .on('click', () => game.cheat(this.grid(symbol, count)));
            }
        }

        // The buttons press the machine's own, so they go dead wherever it
        // does: over a spin and its reveal, and on a balance that is out.
        const follow = () => (folder.disabled = !game.canSpin);

        follow();
        gameStore.subscribe(follow);
    }

    // Every run of a symbol the paytable pays for, shortest first: the lengths
    // listed as partials, and then the whole payline, which is the one that
    // pays on the symbol itself. Lengths the machine has no reels for are left
    // off, so a paytable written for a wider one puts up no button that cannot
    // be landed.
    private wins(symbol: string) {
        const { partial, full } = definition.payouts;
        const reels = definition.strips.length;
        const counts = Object.keys(partial)
            .map(Number)
            .filter((count) => count < reels)
            .sort((a, b) => a - b);

        return [
            ...counts.map((count) => ({ count, payout: partial[count] })),
            { count: reels, payout: full[symbol] },
        ];
    }

    // The grid a cheat lands: rolled off the strips like any spin, then the
    // first payline filled with `count` of the symbol and put deliberately off
    // it after, since a run only pays at its own length while the reel after
    // it misses.
    private grid(symbol: string, count: number) {
        const grid = rollGrid(definition);
        const miss = symbols[(symbols.indexOf(symbol) + 1) % symbols.length];

        definition.lines[0].forEach((row, reel) => {
            grid[reel][row] = reel < count ? symbol : miss;
        });

        return grid;
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

        // Width is left to the fold: it is what the panel is open or shut. The
        // cap is not — open or shut, mid-fold or settled, the panel is never
        // wider than it is open. See `fold`.
        container.style.cssText = `position:fixed;bottom:8px;right:8px;z-index:2;max-width:${paneWidth}`;

        document.body.appendChild(container);

        return container;
    }
}

export const devTools = new DevToolsController();
