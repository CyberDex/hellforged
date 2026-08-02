import '@pixi/layout';
import { BetSlider } from './components/BetSlider';
import { Pannel } from './Pannel.layout';
import type { SoundPlayer } from 'controllers/contracts';

export class BetPannel extends Pannel {
    readonly slider: BetSlider;

    constructor(sound: SoundPlayer) {
        super('Bet', { position: 'center', marginTop: 210, marginLeft: -155 });

        this.slider = new BetSlider(sound);

        this.addContent({
            slider: {
                content: this.slider,
                styles: { position: 'center', marginTop: 35, marginLeft: 10 },
            },
        });
    }
}
