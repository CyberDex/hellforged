import { settings } from 'config/game.settings';
import { definition } from 'config/game.definition';
import { backend } from './backend.controller';
import { sound } from './sound.controller';
import { tween } from './tween.controller';
import { gameStore } from 'store/game.store';
import type { GameState } from 'store/game.store';
import type { Position, SpinResult } from 'engine/engine';
import type { RootLayout } from 'layout/Root.layout';
import type { Reels } from 'layout/components/Reels';

class GameController {
    #layout?: RootLayout;
    #reels?: Reels;
    #landed = 0;
    // The backend's outcome, held until the reels finish landing on it.
    #win = 0;
    #symbols: string[][] = [];
    #positions: Position[] = [];
    #anticipation: SpinResult['anticipation'];

    init(layout: RootLayout) {
        const { betSlider, reels, betPannel, winPannel } = layout;

        this.#layout = layout;
        this.#reels = reels;

        // Before the slider is listened to, so restoring the handle is not
        // read back as a new bet.
        const { bet, win, symbols } = gameStore.getState();

        betPannel.value = bet;
        betSlider.value = bet;

        if (symbols) reels.symbols = symbols;

        winPannel.value = win;

        this.listen(layout);

        // A restored balance may no longer cover the restored bet; after the
        // subscribe, so the pannel follows the bet down.
        this.settle();

        sound.play('music');
    }

    get state() {
        return gameStore.getState().state;
    }

    get canSpin() {
        const { state, balance } = gameStore.getState();

        return state === 'idle' && balance >= settings.minBet;
    }

    // Dev only: hands the next spin the grid it has to land on.
    // TODO: wrap with conditional compiler check to exclude from production builds.
    cheat(grid: string[][]) {
        if (!this.canSpin) return;

        backend.force(grid);
        this.spin();
    }

    updateBalance(balance: number) {
        gameStore.getState().setBalance(balance);

        if (this.state === 'idle') this.settle();
    }

    private listen(layout: RootLayout) {
        const {
            spinButton,
            betSlider,
            reels,
            betPannel,
            winPannel,
            winLayout,
        } = layout;

        spinButton.onPress.connect(() => this.spin());
        betSlider.onUpdate.connect((bet) => gameStore.getState().setBet(bet));

        reels.on('stopped', () => this.reelStopped());

        winLayout.on('revealed', (win: number) => (winPannel.value = win));

        gameStore.subscribe((current, previous) => {
            const { state, bet, win } = current;

            if (bet !== previous.bet) betPannel.value = bet;

            if (win !== previous.win) {
                if (win > 0) {
                    winLayout.show(win, this.countDuration);
                    sound.play('win');
                } else {
                    winPannel.value = win;
                }
            }

            if (state === previous.state) return;

            if (state !== 'idle') this.lockControls();

            if (state === 'spin') {
                spinButton.rotate();
                sound.play('reelSpin');
            } else if (previous.state === 'spin') {
                sound.stop('reelSpin');
            }

            if (state === 'idle') {
                winLayout.hide();
                reels.highlight(null);

                // The announcement is what reveals the figure; the pannel is
                // what keeps it beside the reels.
                winPannel.value = win;

                if (layout.unzoom()) sound.play('reelStop');
                this.settle();
            }
        });
    }

    private settle() {
        const { balance, setBalance } = gameStore.getState();

        if (balance > 0 && balance < settings.minBet) setBalance(0);

        this.capBet();
        this.lockControls();
    }

    private lockControls() {
        if (!this.#layout) return;

        const { spinButton, betSlider, betPannel, winLayout } = this.#layout;
        const { canSpin } = this;

        spinButton.enabled = canSpin;
        betSlider.enabled = canSpin;

        if (canSpin) {
            betPannel.value = gameStore.getState().bet;
            winLayout.hide();

            return;
        }

        // A running spin still reads out its stake; only being out empties it.
        if (this.state !== 'idle') return;

        betPannel.clear();
        winLayout.outOfFunds();
    }

    private capBet() {
        const betSlider = this.#layout?.betSlider;

        if (!betSlider) return;

        const { balance, bet } = gameStore.getState();

        betSlider.max = Math.max(
            Math.min(settings.maxBet, balance),
            settings.minBet,
        );

        if (bet > betSlider.max) betSlider.value = betSlider.max;
    }

    private async spin() {
        if (this.state !== 'idle') return;

        const { balance, bet, setBalance, setResult } = gameStore.getState();

        if (balance < bet) return;

        setBalance(balance - bet);
        setResult(null, 0);

        this.setState('spin');
        this.#reels?.spin();

        const asked = performance.now();
        const outcome = await backend.spin(bet);
        // Stops are anchored to the press: a slow answer stops the first reel
        // at once and keeps the others their delay apart behind it.
        const elapsed = Math.min(
            performance.now() - asked,
            settings.spinDuration,
        );

        this.#win = outcome.win;
        this.#symbols = outcome.grid;
        this.#positions = outcome.wins.flatMap(({ positions }) => positions);
        this.#landed = 0;
        this.#anticipation = outcome.anticipation;

        // On the game's own clock, not the wall's: a backgrounded spin holds
        // with the frames and lands its reels apart, not in a heap on return.
        for (let index = 0; index < definition.strips.length; index++) {
            tween.run({
                duration: this.stopDelay(index) - elapsed,
                onComplete: () => this.#reels?.stop(index, outcome.grid[index]),
            });
        }
    }

    private stopDelay(index: number) {
        const delay = settings.spinDuration + index * settings.reelStopDelay;
        const held = this.#anticipation && index >= this.#anticipation.fromReel;

        return held ? delay * settings.anticipationSpins : delay;
    }

    private reelStopped() {
        if (this.state !== 'spin') return;

        sound.play('reelStop');

        this.#landed++;

        if (this.#anticipation) {
            const { fromReel } = this.#anticipation;

            // Zoomed in over the gap before the first held-back reel, so the
            // game is full in by the time it lands.
            if (this.#landed === fromReel) {
                sound.play('anticipation');
                this.#layout?.zoom(
                    this.stopDelay(fromReel) - this.stopDelay(fromReel - 1),
                );
            } else if (
                this.#landed === definition.strips.length &&
                !this.bigWin
            ) {
                this.#layout?.unzoom();
            }
        }

        if (this.#landed < definition.strips.length) return;

        const { balance, setBalance, setResult } = gameStore.getState();

        setBalance(balance + this.#win);
        setResult(this.#symbols, this.#win);

        if (this.#win <= 0) return this.setState('idle');

        this.#reels?.highlight(this.#positions);
        this.setState('reveal');

        // On the game's clock like the stops, so a backgrounded reveal waits
        // to be watched rather than timing out unseen.
        tween.run({
            duration: this.revealDuration,
            onComplete: () => this.setState('idle'),
        });
    }

    // The win decides the stage, not the symbols.
    private get bigWin() {
        return settings.bigWinStages
            .filter(({ from }) => this.#win >= from)
            .pop();
    }

    private get revealDuration() {
        return settings.winDuration * (this.bigWin?.reveals ?? 1);
    }

    private get countDuration() {
        return this.bigWin
            ? this.revealDuration - settings.bigWinHold
            : settings.winCountDuration;
    }

    private setState(state: GameState) {
        gameStore.getState().setState(state);
    }
}

export const game = new GameController();
