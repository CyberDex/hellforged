import '@pixi/layout';
import { Layout } from '@pixi/layout';
import type { Styles } from '@pixi/layout';
import { Sprite, Text } from 'pixi.js';
import { formatAmount } from 'utils/formatAmount';

// Nothing to show reads better as a dash than as a zero.
const EMPTY = '-';

export class Pannel extends Layout {
    readonly #value: Text;

    constructor(title: string, styles?: Styles) {
        const val = new Text({
            text: EMPTY,
            style: {
                fontSize: 32,
                align: 'center',
                stroke: { color: '#000000', width: 4 },
            },
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
                            fontSize: 22,
                            marginLeft: -55,
                            marginTop: -10,
                            stroke: { color: '#000000', width: 4 },
                        },
                    },
                    value: {
                        content: val,
                        styles: {
                            position: 'center',
                            width: '100%',
                            height: '100%',
                            // The value changes width as digits come and go,
                            // so the block keeps it centred, not its own
                            // measured size.
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
                ...styles,
            },
        });

        this.#value = val;
    }

    set value(value: number) {
        this.#value.text = value > 0 ? formatAmount(value) : EMPTY;
    }

    clear() {
        this.#value.text = EMPTY;
    }
}
