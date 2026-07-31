import '@pixi/layout';
import { BetSlider } from './components/BetSlider';
import { Pannel } from './Pannel.layout';

export class BetPannel extends Pannel {
    readonly slider: BetSlider;

    constructor() {
        super('Bet', { position: 'center', marginTop: 276, marginLeft: -155 });

        this.slider = new BetSlider();

        this.addContent({
            slider: {
                content: this.slider,
                styles: { position: 'center', marginTop: 35, marginLeft: 10 },
            },
        });
    }
}
