import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Text, Ticker } from 'pixi.js';
import { settings } from 'config/game.settings';

export class WinLayout extends Layout {
    #amount: Text;

    constructor() {
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
                        content: 'WIN',
                        styles: {
                            position: 'center',
                            fontSize: 50,
                            marginTop: -40,
                            stroke: { color: '#000000', width: 4 },
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

        this.#amount = amount;
        this.visible = false;
    }

    // The amount is counted up from zero rather than printed, so the win reads
    // as it is being added up. How long it takes is the caller's, since the top
    // win counts up over its whole reveal and a smaller one is quicker than
    // the time it is left up for.
    show(win: number, countDuration = settings.winCountDuration) {
        let elapsed = 0;

        this.#amount.text = '0';
        this.visible = true;

        const tick = ({ deltaMS }: Ticker) => {
            elapsed += deltaMS;

            const progress = Math.min(elapsed / countDuration, 1);

            this.#amount.text = Math.round(win * progress).toString();

            if (progress === 1) Ticker.shared.remove(tick);
        };

        Ticker.shared.add(tick);
    }

    hide() {
        this.visible = false;
    }
}
