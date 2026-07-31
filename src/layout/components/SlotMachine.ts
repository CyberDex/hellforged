import { Container, Rectangle, type Sprite } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import type { Reels } from './Reels';

const { cabinetOffset, windowOverhang, windowCrop } = visuals.machine;

export class SlotMachine extends Container {
    // How far the grid sits below the art's middle, scaled with it.
    readonly offset: number;

    constructor(cabinet: Sprite, reels: Reels, mask: Sprite) {
        super();

        const { width, height, rowHeight } = reels;

        // The window the grid asks for, not the one the art was drawn around:
        // both sprites are stretched onto it, so the grid decides what shows.
        const windowWidth = width + windowOverhang * 2;
        // A grid one row deep is the row that pays, and is shown whole.
        const windowHeight = Math.max(height - windowCrop * 2, rowHeight);

        const scaleX = windowWidth / mask.width;
        const scaleY = windowHeight / mask.height;

        cabinet.anchor.set(0.5);
        cabinet.scale.set(scaleX, scaleY);
        cabinet.position.set(width / 2, height / 2 - cabinetOffset * scaleY);

        mask.anchor.set(0.5);
        mask.scale.set(scaleX, scaleY);
        mask.position.set(width / 2, height / 2);

        this.offset = cabinetOffset * scaleY;

        // A sibling, not a parent: the mask crops the symbols alone.
        this.addChild(cabinet, reels, mask);

        reels.mask = mask;

        // The machine is placed by its grid, so that is all it measures.
        this.boundsArea = new Rectangle(0, 0, width, height);
    }
}
