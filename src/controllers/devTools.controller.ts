import type { GlRenderingContext, WebGLRenderer } from 'pixi.js';
import { Pane } from 'tweakpane';
import { gameName } from 'config/game.name';
import { definition, symbols } from 'config/game.definition';
import { rollGrid } from 'engine/engine';
import { gameStore } from 'store/game.store';
import { app } from './app.controller';
import { game } from './game.controller';

// Every draw Pixi makes leaves through one of these four context calls.
const draws = [
    'drawArrays',
    'drawElements',
    'drawArraysInstanced',
    'drawElementsInstanced',
] as const;

// Fixed scale, so the same spike is always the same height.
const maxDrawCalls = 20;

const paneWidth = '180px';

const title = (drawCalls: number) => `DC: ${drawCalls}`;

const foldKey = `${gameName}.devTools`;

type Fold = 'pane' | 'cheats';

// Mounted only in dev — see `main.ts`. https://tweakpane.github.io/docs/
class DevToolsController {
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

    // Shut, the panel shrinks onto its title bar — but only after the fold
    // has run: mid-fold the graph SVG measures at its 300px default (100% of
    // an unsized box) and bulges the panel, hence the max-width cap.
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

    private expanded(fold: Fold) {
        return localStorage.getItem(`${foldKey}.${fold}`) !== 'false';
    }

    private remember(fold: Fold, expanded: boolean) {
        localStorage.setItem(`${foldKey}.${fold}`, String(expanded));
    }

    private drawCalls(pane: Pane) {
        const { gl } = app.renderer as WebGLRenderer;

        // Nothing to count on WebGPU; the rest of the pane still goes up.
        if (!gl) return;

        this.tally(gl);

        // Empty label rather than none: left out, Tweakpane names the graph
        // after the property. interval: 0 gives the ticker the sampling.
        pane.addBinding(this.#stats, 'drawCalls', {
            readonly: true,
            view: 'graph',
            label: undefined,
            min: 0,
            max: maxDrawCalls,
            interval: 0,
        });

        // Ahead of the render, so the tally is the whole frame just gone.
        app.ticker.add(() => {
            this.#stats.drawCalls = this.#calls;
            this.#calls = 0;

            pane.refresh();
            this.retitle(pane);
        });
    }

    // On the title bar, so the count reads with the panel shut; Tweakpane
    // skips unchanged titles.
    private retitle(pane: Pane) {
        pane.title = title(this.#stats.drawCalls);
    }

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

        const follow = () => (folder.disabled = !game.canSpin);

        follow();
        gameStore.subscribe(follow);
    }

    // Shortest first; lengths the machine has no reels for are left off.
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

    // The reel after the run must miss, or a shorter win lands as a longer one.
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

    // On the page itself, so it sits over the React overlay (`ui.css`).
    private container() {
        const container = document.createElement('div');

        container.style.cssText = `position:fixed;bottom:8px;right:8px;z-index:2;max-width:${paneWidth}`;

        document.body.appendChild(container);

        return container;
    }
}

export const devTools = new DevToolsController();
