import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Text } from 'pixi.js';
import { gmeSettings } from 'config/game.settings';
import { sound } from 'controllers/sound.controller';
import { tween } from 'controllers/tween.controller';
import type { Tween } from 'controllers/tween.controller';
import { CoinShower } from 'layout/components/CoinShower';
import { formatAmount } from 'utils/formatAmount';

export class WinLayout extends Layout {
    readonly #title: Text;
    readonly #amount: Text;
    readonly #coins: CoinShower;
    #count?: Tween;

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
                            // The amount grows a digit at a time; the layout
                            // keeps it centred, not its own width.
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
                position: 'center',
                width: '100%',
                height: '100%',
                marginTop: -15,
            },
        });

        this.#title = title;
        this.#amount = amount;
        this.#coins = new CoinShower();
        // Straight to the layout, not as content: content would be measured
        // and fitted as an often-empty box.
        this.addChildAt(this.#coins, 0);
        this.visible = false;
    }

    show(win: number, countDuration = gmeSettings.winCountDuration) {
        // Rewritten (and heard) only on the frames the figure actually moves.
        let counted = 0;
        let stages = 0;

        this.announce('WIN', '0');

        this.#count = tween.run({
            duration: countDuration,
            to: win,
            onUpdate: (climbing) => {
                const amount = Math.round(climbing);

                if (amount === counted) return;

                counted = amount;
                this.#amount.text = formatAmount(amount);
                sound.play('coin');

                // The climbing number decides the announcement; a frame can
                // pass several stages, and only the last is left up.
                while (stages < gmeSettings.bigWinStages.length) {
                    const stage = gmeSettings.bigWinStages[stages];

                    if (amount < stage.from) break;

                    this.#title.text = stage.title;
                    stages++;
                }

                if (stages > 0) this.#coins.drop(this.dropPoint);
            },
            onComplete: () => {
                this.stopCount();
                this.emit('revealed', win);
            },
        });
    }

    outOfFunds() {
        this.announce('OUT OF', 'FUNDS');
    }

    hide() {
        this.stopCount();
        this.#coins.clear();
        this.visible = false;
    }

    // Anywhere along the figure, so a growing number showers wider with it.
    private get dropPoint() {
        const { x, y, width, height } = this.#amount.getBounds();

        return this.#coins.toLocal({
            x: x + Math.random() * width,
            y: y + height / 2,
        });
    }

    private announce(title: string, amount: string) {
        // A running count belongs to what is being written over; its coins go too.
        this.stopCount();
        this.#coins.clear();

        this.#title.text = title;
        this.#amount.text = amount;
        this.visible = true;
    }

    private stopCount() {
        this.#count?.stop();
        this.#count = undefined;
    }
}
