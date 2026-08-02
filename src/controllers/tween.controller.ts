import { Ticker } from 'pixi.js';
import type { Tween, Tweening } from './contracts';

type Running = {
    duration: number;
    from: number;
    to: number;
    ease: (progress: number) => number;
    onUpdate?: (value: number) => void;
    onComplete?: () => void;
    elapsed: number;
    stopped: boolean;
};

const linear = (progress: number) => progress;

export class TweenController {
    #running: Running[] = [];
    #initialized = false;

    init() {
        if (this.#initialized) return;

        this.#initialized = true;
        // On the shared ticker until destroyed, never mid-tick: Pixi reads a
        // listener's next after calling it, so one that takes itself off
        // mid-tick ends the frame there and every listener behind it is
        // skipped. An empty list costs nothing to walk.
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

        // Flagged, not removed: a tween may be stopped from inside another
        // one's frame, while the list is being walked.
        return { stop: () => void (running.stopped = true) };
    }

    destroy() {
        if (!this.#initialized) return;

        this.#initialized = false;
        Ticker.shared.remove(this.tick, this);
        this.#running = [];
    }

    private tick({ deltaMS }: Ticker) {
        // Only what was running as the frame opened; new tweens begin next frame.
        const opened = this.#running.length;
        let ended = false;

        for (let i = 0; i < opened; i++) {
            const running = this.#running[i];

            if (running.stopped) {
                ended = true;

                continue;
            }

            const { from, to } = running;

            running.elapsed += deltaMS;

            const progress = Math.min(running.elapsed / running.duration, 1);

            running.onUpdate?.(from + (to - from) * running.ease(progress));

            if (progress < 1) continue;

            // Over before it is told, so an owner stopping its own tween on
            // arrival finds it already off.
            running.stopped = true;
            ended = true;

            running.onComplete?.();
        }

        if (ended) {
            this.#running = this.#running.filter(({ stopped }) => !stopped);
        }
    }
}
