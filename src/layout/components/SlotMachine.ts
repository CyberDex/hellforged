import { Container, Rectangle, type Sprite } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import type { Reels } from './Reels';

const { cabinetOffset } = visuals.machine;

export class SlotMachine extends Container {
    constructor(cabinet: Sprite, reels: Reels, mask: Sprite) {
        super();

        // The grid the other two are hung on: the window is centred on it and
        // the cabinet is centred on the window.
        const { width, height } = reels;

        cabinet.anchor.set(0.5);
        cabinet.position.set(width / 2, height / 2 - cabinetOffset);

        mask.anchor.set(0.5);
        mask.position.set(width / 2, height / 2);

        // The cabinet behind the symbols, then the grid, then the window it is
        // cropped to. The window is a sibling of the grid rather than a parent
        // of the lot, so it crops the symbols alone and leaves the cabinet and
        // its ornaments whole.
        this.addChild(cabinet, reels, mask);

        reels.mask = mask;

        // The machine is placed by its grid, so that is all it measures: the
        // cabinet and the window are both larger, and neither may move the rows
        // off the middle of the screen.
        this.boundsArea = new Rectangle(0, 0, width, height);
    }
}
