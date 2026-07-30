import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Sprite } from 'pixi.js';

export class Pannel extends Layout {
    constructor(title: string) {
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
                        content: '555',
                        styles: {
                            position: 'center',
                            color: '#ffca50',
                            fontSize: 24,
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
    }
}
