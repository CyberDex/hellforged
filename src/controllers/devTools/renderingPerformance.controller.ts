import type { WebGLRenderer } from 'pixi.js';
import { UPDATE_PRIORITY } from 'pixi.js';
import { countDrawCalls } from 'utils/countDrawCalls';
import { timeFrames } from 'utils/timeFrames';
import { app } from '../app.controller';

// The numbers behind the dev tools' graphs, sampled once a frame; knows
// nothing of the pane that draws them. `drawCalls` is the frame's batches,
// `work` its CPU time — every ticker listener plus the encode and submit of
// the render — and `fps` the wall clock between frames turned upside down:
// low while `work` sits low points off the CPU (the GPU, GC, the page).
class RenderingPerformanceController {
    // Rewritten in place every frame, so the pane can bind to it once.
    readonly stats = { drawCalls: 0, work: 0, fps: 0 };

    // Swapped for the live counter in `init`; zero stands in on WebGPU.
    #drawCalls = () => 0;
    // Same swap for the frame clock.
    #time = () => ({ work: 0, frame: 0 });

    // True when the renderer has draw calls to count — WebGPU has none.
    get countsDraws() {
        return Boolean((app.renderer as WebGLRenderer).gl);
    }

    // The clock goes in first, the sampler last — behind the render (LOW),
    // so a sample is the whole frame just gone and whatever `onSample` does
    // with it stays off the clock.
    init(onSample: () => void) {
        const { gl } = app.renderer as WebGLRenderer;

        // Nothing to count on WebGPU; the timings still go up.
        if (gl) this.#drawCalls = countDrawCalls(gl);

        this.#time = timeFrames(app.ticker);

        app.ticker.add(
            () => {
                this.sample();
                onSample();
            },
            this,
            UPDATE_PRIORITY.UTILITY,
        );
    }

    private sample() {
        const { work, frame } = this.#time();

        this.stats.work = work;
        this.stats.fps = 1000 / frame;
        this.stats.drawCalls = this.#drawCalls();
    }
}

export const renderingPerformance = new RenderingPerformanceController();
