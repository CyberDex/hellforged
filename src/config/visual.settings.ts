// How the game is dressed rather than how it plays — see `game.settings.ts`
// for what a spin is worth and how long it takes.

export const visuals = {
    machine: {
        reelGap: 30,
        // How far the art's window sits below its middle, in art pixels,
        // before the cabinet is stretched onto the grid.
        cabinetOffset: 32,
        // Also in art pixels: out past the outside columns so nothing clips,
        // in over the top and bottom rows so the strip reads as running past
        // the window. The art only reads undistorted near its native 3x3.
        windowOverhang: 8.5,
        windowCrop: 49.5,
        dimmedFace: 0.4,
    },
    spinButton: {
        hoverScale: 1.1,
        tweenDuration: 100,
        rotateDuration: 200,
    },
    betSlider: {
        width: 120,
        height: 3,
        handle: 9,
        pit: '#7a2f10',
        metal: '#ffca50',
        outline: '#000000',
        outlineWidth: 2,
    },
    coins: {
        // Radians off straight up, either side.
        spread: 0.8,
        // Pixels a second at the least, twice that at the most.
        speed: 420,
        gravity: 2000,
        size: 0.9,
        // Turns per second.
        spin: 1.5,
        // Seconds in the air, and how much of the end spent fading out.
        life: 1.1,
        fade: 0.4,
    },
    // Background shader strength; skipped altogether when off (see `BG.ts`).
    burn: 1.5,
};
