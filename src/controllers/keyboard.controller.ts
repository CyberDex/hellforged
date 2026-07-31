import { settings } from 'config/game.settings';
import { game } from './game.controller';
import type { RootLayout } from 'layout/Root.layout';

const { betSteps, betStepCommand } = settings;

// The keys work the same button and slider the pointer does.
class KeyboardController {
    #layout?: RootLayout;

    init(layout: RootLayout) {
        this.#layout = layout;

        window.addEventListener('keydown', (event) => this.press(event));
    }

    private press(event: KeyboardEvent) {
        const { key, repeat, metaKey } = event;
        const layout = this.#layout;

        // A key reaches only as far as a press or a drag would.
        if (!layout || !this.free || !game.canSpin) return;

        // One spin per press, however long the bar is held down.
        if (key === ' ') {
            if (!repeat) layout.spinButton.press();

            return;
        }

        const steps = betSteps[key];

        if (!steps) return;

        // Command+arrow is the browser's own way back through history, so an
        // arrow the bet answers to is taken here.
        event.preventDefault();

        layout.betSlider.nudge(metaKey ? steps * betStepCommand : steps);
    }

    // Only while nothing on the overlay holds focus and nothing is standing
    // open over the game (`.veil` in `ui.css`).
    private get free() {
        return (
            document.activeElement === document.body &&
            !document.querySelector('.veil')
        );
    }
}

export const keyboard = new KeyboardController();
