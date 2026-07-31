import '@pixi/layout';
import { Layout } from '@pixi/layout';
import { Container, Rectangle, Sprite } from 'pixi.js';
import { visuals } from 'config/visual.settings';
import type { Reels } from './Reels';

const { cabinetWindow, windowOverhang, windowCrop } = visuals.machine;

export class SlotMachine extends Layout {
    constructor(reels: Reels) {
        const { width, height, rowHeight } = reels;

        // The window the grid asks for, not the one the art was drawn around:
        // both sprites are stretched onto it, so the grid decides what shows.
        const windowWidth = width + windowOverhang * 2;
        // A grid one row deep is the row that pays, and is shown whole.
        const windowHeight = Math.max(height - windowCrop * 2, rowHeight);

        // Each sprite is measured by its own art, so the pair owe each other
        // nothing: the cabinet by where it drew the window, the mask whole.
        const scaleX = windowWidth / cabinetWindow.width;
        const scaleY = windowHeight / cabinetWindow.height;
        // How far the grid sits below the art's middle, scaled with it.
        const offset = cabinetWindow.offset * scaleY;

        const cabinet = Sprite.from('reels');

        cabinet.anchor.set(0.5);
        cabinet.scale.set(scaleX, scaleY);
        cabinet.position.set(width / 2, height / 2 - offset);

        const mask = Sprite.from('mask');

        mask.anchor.set(0.5);
        mask.scale.set(windowWidth / mask.width, windowHeight / mask.height);
        mask.position.set(width / 2, height / 2);

        const machine = new Container();

        // A sibling, not a parent: the mask crops the symbols alone.
        machine.addChild(cabinet, reels, mask);
        reels.mask = mask;

        // The machine is placed by its grid, so that is all it measures.
        machine.boundsArea = new Rectangle(0, 0, width, height);

        super({
            content: machine,
            styles: {
                position: 'center',
                // The grid is all the machine measures; cabinet and window
                // are larger.
                width,
                height,
                marginTop: offset,
            },
        });
    }
}
