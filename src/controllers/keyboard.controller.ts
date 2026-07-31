import { gmeSettings } from 'config/game.settings';
import type { RootLayout } from 'layout/Root.layout';
import type { GameActions, SoundPlayer } from './contracts';

const { betSteps, betStepCommand } = gmeSettings;

// The keys work the same button and slider the pointer does.
export class KeyboardController {
    #layout?: RootLayout;
    readonly #game: GameActions;
    readonly #sound: SoundPlayer;
    // One reference for adding and removing, or the listener could never
    // come off the window again.
    readonly #press = (event: KeyboardEvent) => this.press(event);

    constructor(game: GameActions, sound: SoundPlayer) {
        this.#game = game;
        this.#sound = sound;
    }

    init(layout: RootLayout) {
        this.#layout = layout;

        window.addEventListener('keydown', this.#press);
    }

    destroy() {
        window.removeEventListener('keydown', this.#press);
        this.#layout = undefined;
    }

    private press(event: KeyboardEvent) {
        const { key, repeat, metaKey } = event;
        const layout = this.#layout;

        // A key reaches only as far as a press or a drag would.
        if (!layout || !this.free || !this.#game.canSpin) return;

        // One spin per press, however long the bar is held down.
        if (key === ' ') {
            if (!repeat) {
                this.#sound.play('click');
                this.#game.spin();
            }

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
