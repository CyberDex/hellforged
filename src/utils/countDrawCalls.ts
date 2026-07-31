import type { GlRenderingContext } from 'pixi.js';

// Every draw Pixi makes leaves through one of these four context calls.
const draws = [
    'drawArrays',
    'drawElements',
    'drawArraysInstanced',
    'drawElementsInstanced',
] as const;

// Wraps the context's draw entry points to count the calls going through.
// The returned flush hands back the tally so far and zeroes it, so calling
// it once a frame reads as draw calls per frame.
export const countDrawCalls = (gl: GlRenderingContext) => {
    let calls = 0;

    for (const call of draws) {
        const draw = gl[call].bind(gl) as (...args: unknown[]) => void;

        gl[call] = (...args: unknown[]) => {
            calls++;

            draw(...args);
        };
    }

    return () => {
        const tally = calls;

        calls = 0;

        return tally;
    };
};
