import { settings } from '../config/game.settings';
import { sound } from './sound.controller';
import { gameStore } from '../store/game.store';
import type { GameState } from '../store/game.store';
import type { RootLayout } from '../layout/Root.layout';
import type { Reels } from '../layout/components/Reels';

class GameController {
    #reels?: Reels;
    #landed = 0;

    // Wired once the layout exists: the controller listens to the view and
    // drives it back, so no component has to know about the store.
    init({ spinButton, reels }: RootLayout) {
        this.#reels = reels;

        spinButton.onPress.connect(() => this.spin());

        // A reel reports in once it has slid its symbols back onto the row
        // grid, which is a little after it was asked to stop.
        reels.on('stopped', () => this.reelStopped());

        gameStore.subscribe(({ state }, previous) => {
            if (state === previous.state) return;

            // Idle is the only state that takes a press, so the button stays
            // blocked from the first tap until the reveal is over.
            spinButton.enabled = state === 'idle';

            if (state === 'spin') {
                spinButton.rotate();
                // The loop belongs to the spin state: it starts with the
                // first reel and is cut when the last one has landed.
                sound.play('reelSpin');
            } else if (previous.state === 'spin') {
                sound.stop('reelSpin');
            }
        });
    }

    get state() {
        return gameStore.getState().state;
    }

    private spin() {
        // Only idle takes a new spin; spin and reveal run to completion.
        if (this.state !== 'idle') return;

        this.#landed = 0;
        this.setState('spin');
        this.#reels?.spin();

        // all reels start together, then stop left to right one delay apart
        for (let index = 0; index < settings.reels; index++) {
            setTimeout(
                () => this.#reels?.stop(index),
                settings.spinDuration + index * settings.reelStopDelay,
            );
        }
    }

    private reelStopped() {
        if (this.state !== 'spin') return;

        // One thud per reel, so the three land audibly left to right.
        sound.play('reelStop');

        // The spin is over once the last reel has landed.
        if (++this.#landed < settings.reels) return;

        this.setState('reveal');

        setTimeout(() => this.setState('idle'), settings.revealDuration);
    }

    private setState(state: GameState) {
        gameStore.getState().setState(state);
    }
}

export const game = new GameController();
