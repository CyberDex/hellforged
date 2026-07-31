// The return read off the definition rather than walked out by hand: the game
// is spun headlessly, at one bet a spin, and what came back is counted. Run
// with `pnpm sim [spins]`. Plain node runs it, stripping the types on the way
// in, which is why the engine and the definition keep clear of Pixi and of the
// bundler's path aliases.
import { definition } from '../src/config/game.definition.ts';
import { spin } from '../src/engine/engine.ts';

const spins = Number(process.argv[2] ?? 1_000_000);

let paid = 0;
let hits = 0;
// What each rung of the paytable landed and paid, keyed as it would be read
// out: the symbol for a filled line, the bare length for a run short of one.
const rungs = new Map<string, { landed: number; paid: number }>();

for (let i = 0; i < spins; i++) {
    const result = spin(definition, 1);

    if (result.win > 0) hits++;

    paid += result.win;

    for (const { symbol, positions, amount } of result.wins) {
        const key =
            positions.length === definition.strips.length
                ? `${symbol} x${positions.length}`
                : `run of ${positions.length}`;
        const rung = rungs.get(key) ?? { landed: 0, paid: 0 };

        rung.landed++;
        rung.paid += amount;
        rungs.set(key, rung);
    }
}

const percent = (share: number) => `${(share * 100).toFixed(2)}%`;

console.log(`spins     ${spins}`);
console.log(`return    ${percent(paid / spins)}`);
console.log(`hit rate  ${percent(hits / spins)}`);
console.log('');

// Biggest contributor to the return first.
const sorted = [...rungs].sort(([, a], [, b]) => b.paid - a.paid);

for (const [key, rung] of sorted) {
    const landed = `1 in ${Math.round(spins / rung.landed)}`;

    console.log(
        `${key.padEnd(10)} landed ${landed.padEnd(12)} paid ${percent(rung.paid / spins)} of stakes`,
    );
}
