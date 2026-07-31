import { Ticker } from 'pixi.js';

// Everything in the game that moves over a set time moves through here: the
// zoom leaning in, a win counting up, the button turning, a reel dipping off
// its landing. They were each keeping their own elapsed, working out their own
// progress and adding and removing their own ticker, which is the same eight
// lines written six ways — and every one of them took itself off the shared
// ticker from inside its own tick, which Pixi answers by cutting the rest of
// the frame short (see the constructor below).

// A movement under way, handed back to whoever started it so it can be dropped
// before it arrives: a zoom that comes down early, a count written over by the
// next one, a dip cut short by another spin. Stopping is all a caller can do to
// one, and stopping it twice — or after it landed — is nothing.
export type Tween = {
    stop(): void;
};

export type Tweening = {
    // How long the movement takes, in milliseconds.
    duration: number;
    // The figure it currently reads, given every frame it is on, including the
    // last one, which lands on `to` exactly rather than near it.
    onUpdate: (value: number) => void;
    // What that figure runs between. Left alone it is the plain 0 to 1 of how
    // far through the movement is, which is all some of them want.
    from?: number;
    to?: number;
    // How the travel is spread over the time: told how far through the
    // movement is, says how far along it. It need not run straight from the one
    // end to the other — a curve is free to go out and come back, which is what
    // a reel's dip does (see `Reel.ts`).
    ease?: (progress: number) => number;
    // Once it has arrived, and only then: a tween stopped on the way is never
    // told, since whatever stopped it already knows.
    onComplete?: () => void;
};

// Everything a movement needs while it is running, with the caller's options
// filled in once here rather than read around a default every frame.
type Running = {
    duration: number;
    from: number;
    to: number;
    ease: (progress: number) => number;
    onUpdate: (value: number) => void;
    onComplete?: () => void;
    elapsed: number;
    stopped: boolean;
};

const linear = (progress: number) => progress;

class TweenController {
    #running: Running[] = [];

    constructor() {
        // On the shared ticker for good, rather than only while there is
        // something to move. Pixi reads a listener's next after calling it, so
        // one that takes itself off mid-tick ends the frame there and every
        // listener behind it is skipped — and this is the listener every
        // movement in the game now runs on, so it is the one that must never do
        // that. A frame with nothing to move walks an empty list and costs
        // nothing.
        Ticker.shared.add(this.tick, this);
    }

    run({
        duration,
        onUpdate,
        from = 0,
        to = 1,
        ease = linear,
        onComplete,
    }: Tweening): Tween {
        const running: Running = {
            duration,
            onUpdate,
            from,
            to,
            ease,
            onComplete,
            elapsed: 0,
            stopped: false,
        };

        this.#running.push(running);

        // Flagged rather than taken off the list here: a caller is free to stop
        // a tween from inside another one's frame, and the list is only ever
        // rebuilt below, where nothing is walking it.
        return { stop: () => void (running.stopped = true) };
    }

    private tick({ deltaMS }: Ticker) {
        // Only what was already running as the frame opened. A tween started
        // from another one's update or arrival begins on the next frame rather
        // than jumping in on whatever is left of this one.
        const opened = this.#running.length;
        let ended = false;

        for (let i = 0; i < opened; i++) {
            const running = this.#running[i];

            // Stopped by its owner since the last frame, or by another tween
            // part way through this one.
            if (running.stopped) {
                ended = true;

                continue;
            }

            const { from, to } = running;

            running.elapsed += deltaMS;

            const progress = Math.min(running.elapsed / running.duration, 1);

            running.onUpdate(from + (to - from) * running.ease(progress));

            if (progress < 1) continue;

            // Marked as over before it is told, so an owner that stops its own
            // tween as it arrives — or starts the next one on top of it —
            // finds it already off.
            running.stopped = true;
            ended = true;

            running.onComplete?.();
        }

        if (ended) {
            this.#running = this.#running.filter(({ stopped }) => !stopped);
        }
    }
}

export const tween = new TweenController();
