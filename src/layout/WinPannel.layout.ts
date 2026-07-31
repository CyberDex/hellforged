import { Pannel } from './Pannel.layout';

// The bet pannel's mirror, on the other side of the spin button.
export class WinPannel extends Pannel {
    constructor() {
        super('Win', { position: 'center', marginTop: 210, marginLeft: 155 });
    }
}
