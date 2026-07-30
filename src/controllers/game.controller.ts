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
    // What the backend already worked out, held back until the reels have
    // finished showing where it came from: the win then goes onto the balance,
    // and the symbols into storage as what the reels are left showing.
    #win = 0;
    #symbols: string[][] = [];
    // Whether this spin holds its last reel back, decided with the outcome,
    // before a reel has moved.
    #anticipating = false;

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
        const { bet, win, symbols } = gameStore.getState();

        betPannel.value = bet;
        betSlider.value = bet;

        // The last spin is carried over the same way: the reels are put back on
        // the symbols they landed on, without a spin to arrive on them, and the
        // win they were paid is read out beside them. So the game opens where
        // the player left it rather than on symbols it never landed on.
        if (symbols) reels.symbols = symbols;

        winPannel.value = win;

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

            // A spin locks the controls as it starts; unlocking them again is
            // the balance's to decide, so it waits for the settling below.
            if (state !== 'idle') this.lockControls();

            if (state === 'spin') {
                spinButton.rotate();
                // The loop belongs to the spin state: it starts with the
                // first reel and is cut when the last one has landed.
                sound.play('reelSpin');
            } else if (previous.state === 'spin') {
                sound.stop('reelSpin');
            }

            // The announcement lasts as long as the reveal does, and a big win
            // holds the zoom for all of it, so both come down together.
            if (state === 'idle') {
                winLayout.hide();

                // A big win is read out from inside the zoom, so the game
                // still has to come down out of it once the reveal is over. It
                // lands back at size the way a reel lands, and is heard as one.
                if (layout.unzoom()) sound.play('reelStop');
                // The stake came off the balance and the win went back on it
                // over the spin, so what the next one can be staked at is only
                // settled now that it is over.
                this.settle();
            }
        });

        // A balance that came back from storage may no longer cover the bet
        // that came with it, or may no longer cover a spin at all, so it is
        // settled before the first press. After the store is listened to, so
        // the pannel follows a bet that has to come down with it.
        this.settle();

        sound.play('music');
    }

    get state() {
        return gameStore.getState().state;
    }

    // Whether the game will take another spin, which is what the button, the
    // slider and the dev panel's cheats all answer to: only between spins, and
    // only while the balance still covers the smallest bet the game deals in.
    get canSpin() {
        const { state, balance } = gameStore.getState();

        return state === 'idle' && balance >= settings.minBet;
    }

    // Dev only: the next spin is handed the payline it has to land on rather
    // than rolling one, and the button is pressed for the player, so a
    // combination can be watched without waiting for it to come up. Turned away
    // wherever a press would be, so a forced payline is never left queued for a
    // spin the player takes later.
    cheat(payline: string[]) {
        if (!this.canSpin) return;

        backend.force(payline);
        this.spin();
    }

    // The balance is also the player's to set, from the UI's own pop up. That
    // is a change to what the game can do rather than to a figure on a pannel,
    // so it settles: the bet comes down to what is there, and a balance that
    // was out is playable again.
    updateBalance(balance: number) {
        gameStore.getState().setBalance(balance);

        // Nothing is moved under a running spin: its stake has been taken and
        // its win worked out from the bet it was taken at. That spin settles on
        // its own way back to idle.
        if (this.state === 'idle') this.settle();
    }

    // What the balance leaves the game able to do, worked out between spins: a
    // balance too small to stake even the minimum can never be played, so it is
    // not left sitting there as money the player has; the slider comes down to
    // whatever is left; and the controls follow.
    private settle() {
        const { balance, setBalance } = gameStore.getState();

        if (balance > 0 && balance < settings.minBet) setBalance(0);

        this.capBet();
        this.lockControls();
    }

    // The bet goes with the button: the stake for a running spin has already
    // been taken and the win still to come was worked out from it, and a
    // balance that is out has nothing to stake either way, so the slider is
    // taken off the machine rather than shown unusable. Being out is also
    // said over the reels, in the place a win is announced, since a game that
    // will not spin again should say why rather than just stop answering.
    private lockControls() {
        if (!this.#layout) return;

        const { spinButton, betSlider, betPannel, winLayout } = this.#layout;
        const { canSpin } = this;

        spinButton.enabled = canSpin;
        betSlider.enabled = canSpin;

        // A balance that can be staked again puts back what being out took off
        // the machine: the bet is read out once more, and the news over the
        // reels comes down. Only ever reached between spins, since a game that
        // can spin is a game that is not spinning.
        if (canSpin) {
            betPannel.value = gameStore.getState().bet;
            winLayout.hide();

            return;
        }

        // A running spin still reads out what it was staked at; only a balance
        // that is out has nothing left to say on either pannel.
        if (this.state !== 'idle') return;

        // The store keeps its bet, since the slider has to open somewhere for a
        // balance that comes back, but there is nothing to stake at it: the
        // pannel empties to the dash the win pannel sits at between spins
        // rather than reading out a bet that cannot be played.
        betPannel.clear();
        winLayout.outOfFunds();
    }

    // A bet can only be staked as far as there is balance to cover it, so the
    // top of the slider is whichever is lower of the settings maximum and what
    // the player has left, and a bet already above it comes down with it. The
    // bottom end is kept whatever happens, so the last of a balance is still
    // staked at the minimum and a spin there is nothing left to pay for is
    // turned away at the press rather than at the slider.
    private capBet() {
        const betSlider = this.#layout?.betSlider;

        if (!betSlider) return;

        const { balance, bet } = gameStore.getState();

        betSlider.max = Math.max(
            Math.min(settings.maxBet, balance),
            settings.minBet,
        );

        // The store follows the slider here as it does on any other move of
        // the handle, so the pannel comes down with the bet.
        if (bet > betSlider.max) betSlider.value = betSlider.max;
    }

    private spin() {
        // Only idle takes a new spin; spin and reveal run to completion.
        if (this.state !== 'idle') return;

        const { balance, bet, setBalance, setResult } = gameStore.getState();

        // Nothing to stake, nothing to spin for.
        if (balance < bet) return;

        // The stake goes first, and last spin's result goes off the pannel and
        // out of storage with it: the reels are about to move off the symbols it
        // left them on, so there is no longer a spin for them to come back to.
        setBalance(balance - bet);
        setResult(null, 0);

        // The spin is decided in full before a reel has moved; the reels are
        // only asked to play the outcome back.
        const outcome = backend.spin(bet);

        this.#win = outcome.win;
        this.#symbols = outcome.reels;
        this.#landed = 0;
        // Every reel but the last landing on the same symbol leaves the top win
        // in play, which is what the last reel is drawn out for. What it ends up
        // paying is what the zoom is then dropped or held on.
        this.#anticipating = outcome.payline
            .slice(0, -1)
            .every((symbol) => symbol === outcome.payline[0]);
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
            } else if (this.#landed === settings.reels && !this.bigWin) {
                // The last reel landed on nothing worth leaning in for: the
                // reels jump back out to size and whatever it did pay is paid at
                // it. A big win keeps the zoom, and the reveal comes up inside
                // it. The drop back is on the same beat as the reel landing, so
                // the thud above is already the sound of it and none is added
                // here.
                this.#layout?.unzoom();
            }
        }

        // The spin is over once the last reel has landed.
        if (this.#landed < settings.reels) return;

        const { balance, setBalance, setResult } = gameStore.getState();

        setBalance(balance + this.#win);
        // The reels are now standing on the outcome, so it is put away with the
        // win it paid, for the next session to open on.
        setResult(this.#symbols, this.#win);

        // A losing spin has nothing to reveal, so it goes straight back to
        // idle and the button unlocks as the last reel lands.
        if (this.#win <= 0) return this.setState('idle');

        this.setState('reveal');

        // A win is left up long enough to be read and counted up.
        setTimeout(() => this.setState('idle'), this.revealDuration);
    }

    // Which stage of big win the spin paid, if any: the last one the amount
    // reaches, since the stages climb. Known as soon as the outcome is, before a
    // reel has moved, and it is the win that says this rather than the symbols —
    // a pair staked high enough is a big win, and three of a kind at the minimum
    // is not.
    private get bigWin() {
        return settings.bigWinStages
            .filter(({ from }) => this.#win >= from)
            .pop();
    }

    // How long the win is left up. A big win is given the several reveals its
    // stage asks for, since it is read out from the zoom it was built up to
    // rather than flashed and dropped.
    private get revealDuration() {
        return settings.winDuration * (this.bigWin?.reveals ?? 1);
    }

    // How long the amount takes to count up. A big win climbs for all of its
    // reveal bar the hold at the end of it, so the number is still going up
    // almost the whole time it is there and then stands on what it reached.
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
