import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite, Text } from 'pixi.js';

// Nothing to show reads better as a dash than as a zero, so the win pannel
// sits empty between spins and only carries a figure when there is one.
const EMPTY = '-';

export class Pannel extends Layout {
    #value: Text;

    constructor(title: string) {
        const val = new Text(EMPTY, {
            fontFamily: 'Arial',
            fill: '#ffca50',
            fontSize: 24,
            align: 'center',
        });

        super({
            content: {
                content: {
                    bg: {
                        content: Sprite.from('pannel'),
                        styles: { position: 'center' },
                    },
                    titleText: {
                        content: title,
                        styles: {
                            position: 'center',
                            color: '#ffca50',
                            fontSize: 18,
                            marginLeft: -55,
                            marginTop: -10,
                        },
                    },
                    value: {
                        content: val,
                        styles: {
                            position: 'center',
                            width: '100%',
                            height: '100%',
                            // The value changes width as digits come and go, so
                            // the block keeps it centred rather than its own
                            // measured size, which is only taken on a resize.
                            textAlign: 'center',
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

        this.#value = val;
    }

    set value(value: number) {
        this.#value.text = value > 0 ? value.toString() : EMPTY;
    }
}
