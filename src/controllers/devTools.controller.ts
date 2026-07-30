import type { GlRenderingContext, WebGLRenderer } from 'pixi.js';
import { Pane } from 'tweakpane';
import { app } from './app.controller';

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
// sits around ten a frame and peaks around twenty over a spin, so this leaves
// room above the worst of it without flattening the rest against the floor.
const maxDrawCalls = 32;

// The panel the game is watched from while it is being worked on. Mounted only
// in dev, and loaded that way too, so none of this reaches the player — see
// `main.ts`. Tweakpane's own docs: https://tweakpane.github.io/docs/
class DevToolsController {
    // What the pane is bound to and reads: the last frame's total, settled, so
    // the graph is never handed a frame that is still being drawn.
    readonly #stats = { drawCalls: 0 };
    #calls = 0;

    init() {
        const { gl } = app.renderer as WebGLRenderer;

        // Nothing to count on WebGPU, which draws through no GL context.
        if (!gl) return;

        this.tally(gl);

        const pane = new Pane({
            container: this.container(),
            title: 'Dev tools',
        });

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

        container.style.cssText =
            'position:fixed;top:8px;right:8px;width:260px;z-index:2';

        document.body.appendChild(container);

        return container;
    }
}

export const devTools = new DevToolsController();
