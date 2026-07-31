import type { GameDefinition } from './definition.ts';

// One stop per strip, the window read off it wrapping over the end.
export function rollGrid({ strips, rows }: GameDefinition): string[][] {
    return strips.map((strip) => {
        const stop = Math.floor(Math.random() * strip.length);

        return Array.from(
            { length: rows },
            (_, row) => strip[(stop + row) % strip.length],
        );
    });
}
