import { Container, Rectangle, type Sprite } from 'pixi.js';
import type { Reels } from './Reels';

// The window in the cabinet art sits this far below the middle of it, so the
// art is lifted by it to line its window up with the grid. In the art's own
// pixels, before the cabinet is stretched onto the grid.
const CABINET_OFFSET = 32;

// How far that window falls outside the grid, also in the art's own pixels: it
// is let out past the outside columns, so nothing is clipped where the symbols
// end, and taken in over the top and bottom rows, so those are only ever part
// seen and the strip reads as running on past the window rather than starting
// and stopping at it.
//
// These are what the window is, rather than what the art happens to measure —
// the cabinet and its window are stretched from the size they were drawn at
// onto whatever grid `settings.reels` and `settings.rows` ask for, so the two
// sprites frame a machine of any size. The art was drawn around a 3x3 and only
// reads undistorted there; a grid far off that shape wants art cut for it.
const WINDOW_OVERHANG = 8.5;
const WINDOW_CROP = 49.5;

export class SlotMachine extends Container {
    // How far the grid sits below the middle of the art around it, so whoever
    // places the machine can centre the cabinet rather than the rows — the
    // cabinet is the thing that is seen to be centred, and the machine measures
    // only the grid inside it. Scaled along with the art, so it stays the same
    // offset in the cabinet however far that has been stretched.
    readonly offset: number;

    constructor(cabinet: Sprite, reels: Reels, mask: Sprite) {
        super();

        // The grid the other two are hung on: the window is centred on it and
        // the cabinet is centred on the window.
        const { width, height, rowHeight } = reels;

        // The window the grid asks for, rather than the one the art was drawn
        // around: a grid of any number of reels and rows gets a window that
        // frames its columns and crops its outer rows, and the two sprites are
        // stretched from their own size onto it. So the art no longer decides
        // how much of the grid is seen — the grid does.
        const windowWidth = width + WINDOW_OVERHANG * 2;
        // Taking the rows in only makes sense while there are rows to spare: a
        // grid one row deep is the row that pays, and is shown whole.
        const windowHeight = Math.max(height - WINDOW_CROP * 2, rowHeight);

        // Both sprites were drawn at the same scale around the same window, so
        // the one the mask needs to reach that window is the one the cabinet
        // needs to go on framing it.
        const scaleX = windowWidth / mask.width;
        const scaleY = windowHeight / mask.height;

        cabinet.anchor.set(0.5);
        cabinet.scale.set(scaleX, scaleY);
        cabinet.position.set(width / 2, height / 2 - CABINET_OFFSET * scaleY);

        mask.anchor.set(0.5);
        mask.scale.set(scaleX, scaleY);
        mask.position.set(width / 2, height / 2);

        this.offset = CABINET_OFFSET * scaleY;

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
