import { Pane } from 'tweakpane';
import { gameName } from 'config/game.name';
import { cheats } from './cheats.controller';
import { renderingPerformance } from './renderingPerformance.controller';

// Fixed scales, so the same spike is always the same height.
const maxDrawCalls = 50;

// The 60 FPS budget: a `work ms` bar at the top has spent the whole budget
// on the CPU; an `FPS` bar at the top is the healthy 60 itself.
const frameBudget = 1000 / 60;
const maxFps = 60;

const paneWidth = '180px';

const title = (drawCalls: number, fps: number, work: number) =>
    `${drawCalls}dc · ${Math.round(fps)}fps · ${work.toFixed(1)}ms`;

const foldKey = `${gameName}.devTools`;

type Fold = 'pane' | 'cheats';

// The short names worn by the graphs themselves.
const names = {
    drawCalls: 'draw calls',
    work: 'work ms',
    fps: 'FPS',
};

// What each graph means, an ⓘ press away.
const hints = {
    drawCalls:
        'Draw calls the renderer made last frame — each one a batch handed ' +
        `to the GPU. The scale tops out at ${maxDrawCalls}: jumps toward ` +
        'the top are a bad sign, batching broken by texture swaps, filters ' +
        'or masks. Steady and low is healthy.',
    work:
        'CPU time of the frame: every ticker listener plus encoding and ' +
        'submitting the render. The scale is the 16.7ms budget of 60 FPS — ' +
        'a bar near the top means the CPU is the bottleneck.',
    fps:
        'Frames per second, from the wall clock between frames. Pinned at ' +
        'the top — 60 — is healthy; dips are missed frames. Low while work ' +
        'stays low points off the CPU: GPU load, GC, the rest of the page.',
};

// The Tweakpane face of the dev tools: graphs reflecting
// `renderingPerformance.stats`, buttons running `cheats` — the logic lives
// in those two. Mounted only in dev — see `main.ts`.
// https://tweakpane.github.io/docs/
class DevToolsController {
    readonly #popup = document.createElement('div');

    init() {
        const container = this.container();
        const pane = new Pane({
            container,
            title: title(0, 0, 0),
            expanded: this.expanded('pane'),
        });

        this.fold(pane, container);
        this.popup(container);
        this.graphs(pane);
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

    private graphs(pane: Pane) {
        if (renderingPerformance.countsDraws) {
            this.overlay(this.graph(pane, 'drawCalls', maxDrawCalls));
        }

        this.overlay(this.graph(pane, 'work', frameBudget));
        this.overlay(this.graph(pane, 'fps', maxFps));

        // Repaints on the controller's beat: right after each frame's sample.
        renderingPerformance.init(() => {
            pane.refresh();
            this.retitle(pane);
        });
    }

    // label: undefined leaves the label column out and the graph full
    // width — `overlay` names it in place. interval: 0 leaves the sampling
    // to `renderingPerformance`.
    private graph(pane: Pane, stat: keyof typeof hints, max: number) {
        const binding = pane.addBinding(renderingPerformance.stats, stat, {
            readonly: true,
            view: 'graph',
            label: undefined,
            min: 0,
            max,
            interval: 0,
        });

        return { stat, element: binding.element };
    }

    // The name on the graph and the ⓘ that explains it; a Tweakpane label
    // column would squeeze the graphs off a 180px pane.
    private overlay({
        stat,
        element,
    }: {
        stat: keyof typeof hints;
        element: HTMLElement;
    }) {
        element.style.position = 'relative';
        element.append(this.tag(names[stat]), this.info(hints[stat]));
    }

    // Inert, so the graph under it still answers the pointer.
    private tag(name: string) {
        const tag = document.createElement('span');

        tag.textContent = name;
        tag.style.cssText =
            'position:absolute;top:1px;left:8px;z-index:1;font-size:9px;' +
            'color:#fff;pointer-events:none';

        return tag;
    }

    private info(hint: string) {
        const info = document.createElement('button');

        info.textContent = 'ⓘ';
        info.style.cssText =
            'position:absolute;top:1px;right:6px;z-index:1;padding:0;' +
            'border:0;background:none;font-size:9px;line-height:1.4;' +
            'color:#fff;cursor:pointer;opacity:.6';

        // Stopped, or the window's shut-on-any-press beats the toggle.
        info.addEventListener('pointerdown', (event) =>
            event.stopPropagation(),
        );
        info.addEventListener('click', () => this.toggle(hint));

        return info;
    }

    // One popup shared by all the ⓘs; each swaps its own text in. Above
    // the pane, so it never covers the graph it explains.
    private popup(container: HTMLElement) {
        this.#popup.style.cssText =
            'display:none;position:absolute;bottom:100%;right:0;' +
            'margin-bottom:4px;width:220px;padding:8px 10px;' +
            'border-radius:6px;background:rgba(24,26,32,.95);color:#bbc;' +
            "font:10px/1.5 'Roboto Mono',Menlo,monospace";

        container.appendChild(this.#popup);

        // A press anywhere else shuts it — the pane's own title bar too.
        window.addEventListener('pointerdown', () => this.hide());
    }

    private hide() {
        this.#popup.style.display = 'none';
    }

    // The same ⓘ closes; another ⓘ swaps the story.
    private toggle(hint: string) {
        const shown =
            this.#popup.style.display !== 'none' &&
            this.#popup.textContent === hint;

        this.#popup.textContent = hint;
        this.#popup.style.display = shown ? 'none' : 'block';
    }

    // On the title bar, so the numbers read with the panel shut.
    private retitle(pane: Pane) {
        const { drawCalls, fps, work } = renderingPerformance.stats;

        pane.title = title(drawCalls, fps, work);
    }

    private cheats(pane: Pane) {
        const folder = pane.addFolder({
            title: 'Cheats',
            expanded: this.expanded('cheats'),
        });

        folder.on('fold', ({ expanded }) => this.remember('cheats', expanded));

        for (const { symbol, count, payout } of cheats.list()) {
            folder
                .addButton({ title: `${symbol} ${count} ×${payout}` })
                .on('click', () => cheats.spin(symbol, count));
        }

        cheats.follow(() => (folder.disabled = !cheats.canSpin));
    }

    // On the page itself, so it sits over the React overlay (`ui.css`).
    private container() {
        const container = document.createElement('div');

        container.style.cssText = `position:fixed;bottom:1px;right:2px;z-index:2;max-width:${paneWidth}`;

        document.body.appendChild(container);

        return container;
    }
}

export const devTools = new DevToolsController();
