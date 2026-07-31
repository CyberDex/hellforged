import { settings } from 'config/game.settings';
import { game } from './game.controller';
import type { RootLayout } from 'layout/Root.layout';

// What the arrows are worth to the bet, and what holding command multiplies
// them by, both as configured: this is the way up a bet that runs to a million
// without the pointer.
const { betSteps, betStepCommand } = settings;

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

        layout.betSlider.nudge(metaKey ? steps * betStepCommand : steps);
    }

    // Whether the keys are the game's to answer. Anything on the overlay that
    // holds the focus is being worked from the keyboard itself — a button that
    // has been pressed, a field being typed into — and whatever the overlay has
    // open takes them whole: the drawer out of the bar and the sheet the rules are
    // read on each lay a veil over the game that keeps pointers off the reels, and
    // the keys are kept off with it rather than playing the machine from behind
    // what is standing open over it (see `.veil` in `ui.css`).
    private get free() {
        return (
            document.activeElement === document.body &&
            !document.querySelector('.veil')
        );
    }
}

export const keyboard = new KeyboardController();
