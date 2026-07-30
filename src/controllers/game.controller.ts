import { settings } from 'config/game.settings';
import { backend } from './backend.controller';
import { sound } from './sound.controller';
import { gameStore } from 'store/game.store';
import type { GameState } from 'store/game.store';
import type { RootLayout } from 'layout/Root.layout';
import type { Reels } from 'layout/components/Reels';

class GameController {
    #layout?: RootLayout;
    #reels?: Reels;
    #landed = 0;
    // The win the backend already worked out, held back until the reels have
    // finished showing where it came from.
    #win = 0;
    // Whether this spin holds its last reel back, decided with the outcome,
    // before a reel has moved.
    #anticipating = false;
    // Whether the held-back reel completes the payline, which is what decides
    // between jumping back out of the zoom and staying in it for the reveal.
    #bigWin = false;

    // Wired once the layout exists: the controller listens to the view and
    // drives it back, so no component has to know about the store.
    init(layout: RootLayout) {
        const {
            spinButton,
            betSlider,
            reels,
            betPannel,
            winPannel,
            winLayout,
        } = layout;

        // The zoom takes in the whole game rather than any one part of it, so
        // it is asked of the layout.
        this.#layout = layout;
        this.#reels = reels;

        // The bet is carried over from the last session, so the pannel and the
        // handle are both put where the player left it. Before the slider is
        // listened to, so placing the handle is not read back as a new bet.
        const { bet } = gameStore.getState();

        betPannel.value = bet;
        betSlider.value = bet;

        spinButton.onPress.connect(() => this.spin());
        // The slider only says what the bet is; the pannel is written from the
        // store like everything else, so the two cannot come apart.
        betSlider.onUpdate.connect((bet) => gameStore.getState().setBet(bet));

        // A reel reports in once it has slid its symbols back onto the row
        // grid, which is a little after it was asked to stop.
        reels.on('stopped', () => this.reelStopped());

        gameStore.subscribe((current, previous) => {
            const { state, bet, win } = current;

            if (bet !== previous.bet) betPannel.value = bet;

            if (win !== previous.win) {
                winPannel.value = win;

                // Only a win is announced over the reels; a losing spin just
                // clears the pannel.
                if (win > 0) {
                    winLayout.show(win, this.countDuration);
                    sound.play('win');
                }
            }

            if (state === previous.state) return;

            // Idle is the only state that takes a press, so the button stays
            // blocked from the first tap until the reveal is over. The bet is
            // locked with it: the stake has already been taken, and the win
            // still to come was worked out from it.
            spinButton.enabled = state === 'idle';
            betSlider.enabled = state === 'idle';

            if (state === 'spin') {
                spinButton.rotate();
                // The loop belongs to the spin state: it starts with the
                // first reel and is cut when the last one has landed.
                sound.play('reelSpin');
            } else if (previous.state === 'spin') {
                sound.stop('reelSpin');
            }

            // The announcement lasts as long as the reveal does, and the top
            // win holds the zoom for all of it, so both come down together.
            if (state === 'idle') {
                winLayout.hide();
                layout.unzoom();
            }
        });

        sound.play('music');
    }

    get state() {
        return gameStore.getState().state;
    }

    private spin() {
        // Only idle takes a new spin; spin and reveal run to completion.
        if (this.state !== 'idle') return;

        const { balance, bet, setBalance, setWin } = gameStore.getState();

        // Nothing to stake, nothing to spin for.
        if (balance < bet) return;

        // The stake goes first and last spin's win goes off the pannel.
        setBalance(balance - bet);
        setWin(0);

        // The spin is decided in full before a reel has moved; the reels are
        // only asked to play the outcome back.
        const outcome = backend.spin(bet);

        this.#win = outcome.win;
        this.#landed = 0;
        // Every reel but the last landing on the same symbol leaves the top win
        // in play, which is what the last reel is drawn out for. Whether it
        // actually fills the payline is what the zoom is dropped or held on.
        this.#anticipating = outcome.payline
            .slice(0, -1)
            .every((symbol) => symbol === outcome.payline[0]);
        this.#bigWin = outcome.payline.every(
            (symbol) => symbol === outcome.payline[0],
        );
        this.setState('spin');
        this.#reels?.spin();

        // all reels start together, then stop left to right one delay apart
        for (let index = 0; index < settings.reels; index++) {
            setTimeout(
                () => this.#reels?.stop(index, outcome.reels[index]),
                this.stopDelay(index),
            );
        }
    }

    // How long into the spin a reel is asked to stop. The last one is held back
    // on a spin that can still fill the payline, so it spins several times as
    // long as it otherwise would.
    private stopDelay(index: number) {
        const delay = settings.spinDuration + index * settings.reelStopDelay;
        const held = this.#anticipating && index === settings.reels - 1;

        return held ? delay * settings.anticipationSpins : delay;
    }

    private reelStopped() {
        if (this.state !== 'spin') return;

        // One thud per reel, so the three land audibly left to right.
        sound.play('reelStop');

        this.#landed++;

        if (this.#anticipating) {
            // The reel before the held-back one has landed: the game zooms in
            // from here, over the gap between the two stops, and is full in by
            // the time the held-back reel lands.
            if (this.#landed === settings.reels - 1) {
                sound.play('anticipation');
                this.#layout?.zoom(
                    this.stopDelay(settings.reels - 1) -
                        this.stopDelay(settings.reels - 2),
                );
            } else if (this.#landed === settings.reels && !this.#bigWin) {
                // The last symbol missed the pair: the reels jump back out to
                // size and the pair is paid at it. A payline that did fill up
                // keeps the zoom, and the reveal comes up inside it.
                this.#layout?.unzoom();
            }
        }

        // The spin is over once the last reel has landed.
        if (this.#landed < settings.reels) return;

        const { balance, setBalance, setWin } = gameStore.getState();

        setBalance(balance + this.#win);
        setWin(this.#win);

        // A losing spin has nothing to reveal, so it goes straight back to
        // idle and the button unlocks as the last reel lands.
        if (this.#win <= 0) return this.setState('idle');

        this.setState('reveal');

        // A win is left up long enough to be read and counted up.
        setTimeout(() => this.setState('idle'), this.revealDuration);
    }

    // How long the win is left up. The top win is given several times the usual
    // reveal, since it is read out from the zoom it was built up to rather than
    // flashed and dropped.
    private get revealDuration() {
        return this.#bigWin
            ? settings.winDuration * settings.bigWinReveals
            : settings.winDuration;
    }

    // How long the amount takes to count up. The top win runs for its whole
    // reveal, so the number is still climbing to it the entire time it is up.
    private get countDuration() {
        return this.#bigWin ? this.revealDuration : settings.winCountDuration;
    }

    private setState(state: GameState) {
        gameStore.getState().setState(state);
    }
}

export const game = new GameController();
