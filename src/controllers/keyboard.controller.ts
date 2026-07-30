import { game } from './game.controller';
import type { RootLayout } from 'layout/Root.layout';

// What a key is worth to the bet, in steps of the slider: up and down nudge it
// one figure at a time, and left and right run it ten at a time.
const betSteps: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    ArrowRight: 10,
    ArrowLeft: -10,
};

// What holding command is worth: a hundred of whatever the arrow already moves,
// so the same four keys also set the bet a hundred and a thousand at a time.
// A bet that runs to a million is a long way up in ones, and this is the way up
// it without the pointer.
const COMMAND = 100;

// The machine played from the keyboard: the space bar takes a spin, and the
// arrows set what it is staked at. None of this is a control of its own — the
// keys work the button and the slider the pointer works, so a spin taken from
// the keyboard is the same spin and is heard and locked as one.
class KeyboardController {
    #layout?: RootLayout;

    init(layout: RootLayout) {
        this.#layout = layout;

        window.addEventListener('keydown', (event) => this.press(event));
    }

    private press(event: KeyboardEvent) {
        const { key, repeat, metaKey } = event;
        const layout = this.#layout;

        // A key reaches only as far as a press or a drag would: both controls
        // are away over a spin and on a balance that is out, and coming at them
        // from the keyboard is no way round that (see `game.controller.ts`).
        if (!layout || !this.free || !game.canSpin) return;

        // One spin per press, however long the bar is held down.
        if (key === ' ') {
            if (!repeat) layout.spinButton.press();

            return;
        }

        // The arrows do repeat: holding one runs the handle along the track the
        // way dragging it does.
        const steps = betSteps[key];

        if (!steps) return;

        // Command and a left or right arrow is the browser's own way back out
        // of the page, so an arrow the bet answers to is taken here rather than
        // left to work the history as well.
        event.preventDefault();

        layout.betSlider.nudge(metaKey ? steps * COMMAND : steps);
    }

    // Whether the keys are the game's to answer. Anything on the overlay that
    // holds the focus is being worked from the keyboard itself — a button that
    // has been pressed, a field being typed into — and a pop up takes them
    // whole: its veil keeps pointers off the reels, and the keys are kept off
    // with them rather than playing the machine from behind the sheet that is
    // covering it (see `Dialog.tsx`).
    private get free() {
        return (
            document.activeElement === document.body &&
            !document.querySelector('[role="dialog"]')
        );
    }
}

export const keyboard = new KeyboardController();
