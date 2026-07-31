// How the game is dressed rather than how it plays: the sizes, the colours and
// the movements the parts are drawn with. What a spin is worth and how long it
// takes is next door in `game.settings.ts`; this is the polish over the top of
// it, kept out of the components so the look is tuned in one place rather than
// hunted for a constant at a time.

export const visuals = {
    machine: {
        // Between one reel and the next, in pixels.
        reelGap: 30,
        // The window in the cabinet art sits this far below the middle of it,
        // so the art is lifted by it to line its window up with the grid. In
        // the art's own pixels, before the cabinet is stretched onto the grid.
        cabinetOffset: 32,
        // How far that window falls outside the grid, also in the art's own
        // pixels: it is let out past the outside columns, so nothing is clipped
        // where the symbols end, and taken in over the top and bottom rows, so
        // those are only ever part seen and the strip reads as running on past
        // the window rather than starting and stopping at it.
        //
        // These are what the window is, rather than what the art happens to
        // measure — the cabinet and its window are stretched from the size they
        // were drawn at onto whatever grid `settings.reels` and `settings.rows`
        // ask for (see `SlotMachine.ts`), so the two sprites frame a machine of
        // any size. The art was drawn around a 3x3 and only reads undistorted
        // there; a grid far off that shape wants art cut for it.
        windowOverhang: 8.5,
        windowCrop: 49.5,
    },
    // The button leans out under the pointer and settles back at the same pace
    // whether it is let go or pressed, so the three states read as the one
    // movement in and out.
    spinButton: {
        hoverScale: 1.1,
        tweenDuration: 100,
        // How long the button takes to turn once as a spin starts.
        rotateDuration: 200,
    },
    // The track the bet is dragged along, drawn to the width of the pannel it
    // sits under, with the handle running from one end of it to the other.
    betSlider: {
        width: 120,
        height: 3,
        handle: 9,
        // The pit the bet is dragged along, and the hot metal marking how far
        // it is up.
        pit: '#7a2f10',
        metal: '#ffca50',
        // What the handle is drawn round with, which the track is not: it is
        // stroked in its own colour instead, so the stroke reads as a slightly
        // thicker track rather than as an edge around it.
        outline: '#000000',
        outlineWidth: 2,
    },
    // How a coin leaves the figure it came off: thrown up, off to one side or
    // the other of straight up by up to `spread` in radians, at `speed` pixels
    // a second at the least and twice that at the most.
    coins: {
        spread: 0.8,
        speed: 420,
        // What pulls it back down, in pixels a second, a second.
        gravity: 2000,
        // How big a coin is drawn, at the least, and twice it at the most, so
        // the shower has coins nearer the player than others.
        size: 0.9,
        // Turns a coin flips through in a second, at the least and half again
        // at most.
        spin: 1.5,
        // How long a coin is in the air, and how much of the end of that it
        // spends fading out, in seconds. Kept short enough that the shower
        // stays about the figure it came off rather than reaching the corners
        // of the screen.
        life: 1.1,
        fade: 0.4,
    },
    // How hard the background is burnt by the shader over it, which a machine
    // that cannot spare the pass does without altogether (see `BG.ts`).
    burn: 1.5,
};
