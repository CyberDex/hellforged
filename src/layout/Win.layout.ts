import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Text, Ticker } from 'pixi.js';
import { settings } from 'config/game.settings';

// Whatever the game has to say over the reels is said in two lines: what has
// happened, over the figure it happened for.
export class WinLayout extends Layout {
    #title: Text;
    #amount: Text;
    // A count outlives the call that started it, so the ticker it runs on is
    // kept to be taken off again by whatever comes up over it next.
    #count?: (ticker: Ticker) => void;

    constructor() {
        const title = new Text({
            text: 'WIN',
            style: {
                fontSize: 50,
                align: 'center',
                stroke: { color: '#000000', width: 4 },
            },
        });
        const amount = new Text({
            text: '0',
            style: {
                fontSize: 75,
                fontWeight: 'bold',
                align: 'center',
                stroke: { color: '#000000', width: 8 },
            },
        });

        super({
            content: {
                content: {
                    title: {
                        content: title,
                        styles: {
                            position: 'center',
                            width: '100%',
                            height: '100%',
                            textAlign: 'center',
                            marginTop: -40,
                        },
                    },
                    amount: {
                        content: amount,
                        styles: {
                            position: 'center',
                            width: '100%',
                            height: '100%',
                            // The amount grows a digit at a time, so it is the
                            // layout that keeps it centred, not its own width.
                            textAlign: 'center',
                            marginTop: 50,
                        },
                    },
                },
                styles: {
                    position: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: 600,
                    minWidth: 500,
                    aspectRatio: 'flex',
                },
            },
            styles: {
                width: '100%',
                height: '100%',
            },
        });

        this.#title = title;
        this.#amount = amount;
        this.visible = false;
    }

    // The amount is counted up from zero rather than printed, so the win reads
    // as it is being added up. How long it takes is the caller's, since the top
    // win counts up over its whole reveal and a smaller one is quicker than
    // the time it is left up for.
    show(win: number, countDuration = settings.winCountDuration) {
        let elapsed = 0;

        this.announce('WIN', '0');

        this.#count = ({ deltaMS }: Ticker) => {
            elapsed += deltaMS;

            const progress = Math.min(elapsed / countDuration, 1);

            this.#amount.text = Math.round(win * progress).toString();

            if (progress === 1) this.stopCount();
        };

        Ticker.shared.add(this.#count);
    }

    // A balance that can no longer be staked is said where the money would have
    // been read out, since it is the same news about the same reels: there is
    // nothing more coming off them.
    outOfFunds() {
        this.announce('OUT OF', 'FUNDS');
    }

    hide() {
        this.stopCount();
        this.visible = false;
    }

    private announce(title: string, amount: string) {
        // Anything already climbing to a figure belongs to what is being
        // written over, so it is taken off before the lines are replaced.
        this.stopCount();

        this.#title.text = title;
        this.#amount.text = amount;
        this.visible = true;
    }

    private stopCount() {
        if (!this.#count) return;

        Ticker.shared.remove(this.#count);
        this.#count = undefined;
    }
}
