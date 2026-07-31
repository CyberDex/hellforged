import type { Ticker } from 'pixi.js';
import { UPDATE_PRIORITY } from 'pixi.js';

// Puts a clock on the ticker's frames. The stamp goes in first (INTERACTION,
// ahead of every game listener), so the whole frame is on the clock;
// call the returned sampler after the render — behind UPDATE_PRIORITY.LOW —
// and `work` is the CPU time of the frame just gone, `frame` the wall clock
// since the one before.
export const timeFrames = (ticker: Ticker) => {
    let start = performance.now();

    ticker.add(
        () => {
            start = performance.now();
        },
        undefined,
        UPDATE_PRIORITY.INTERACTION,
    );

    return () => ({
        work: performance.now() - start,
        frame: ticker.elapsedMS,
    });
};
