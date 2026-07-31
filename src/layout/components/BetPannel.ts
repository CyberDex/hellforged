import '@pixi/layout';
import { BetSlider } from './BetSlider';
import { Pannel } from './Pannel';

export class BetPannel extends Pannel {
    readonly slider: BetSlider;

    constructor() {
        super('Bet', { position: 'center', marginTop: 210, marginLeft: -155 });

        this.slider = new BetSlider();
        this.addContent({
            slider: {
                content: this.slider,
                styles: { position: 'center', marginTop: 35, marginLeft: 10 },
            },
        });
    }
}
