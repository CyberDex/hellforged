// Steps of the bet slider per arrow key (see `keyboard.controller.ts`).
const betSteps: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    ArrowRight: 10,
    ArrowLeft: -10,
};

// A win falls into the last stage it reaches, held that many reveals.
const bigWinStages = [
    { from: 1000, reveals: 2, title: 'BIG WIN' },
    { from: 10000, reveals: 3, title: 'MEGA WIN' },
    { from: 100000, reveals: 4, title: 'EPIC WIN' },
];

// How the game is played and paced; what it plays is `game.definition.ts`.
export const gmeSettings = {
    defaultBalance: 1000000,
    defaultBet: 1,
    minBet: 1,
    maxBet: 1000000,
    betSteps,
    // Holding command multiplies whichever arrow's step by this.
    betStepCommand: 100,
    // Symbols per second.
    spinSpeed: 20,
    // Dip past the grid in symbols (keep under one), its duration, and the
    // share of it spent travelling down.
    bounceDistance: 0.15,
    bounceDuration: 220,
    bounceDown: 0.4,
    // Stand-in server latency, ms; the reels already turn while it thinks.
    responseTime: 300,
    spinDuration: 500,
    reelStopDelay: 550,
    // A payline that can still fill holds its last reel this many times
    // longer, zoomed to this scale.
    anticipationSpins: 2,
    anticipationZoom: 1.1,
    winDuration: 2500,
    winCountDuration: 800,
    balanceCountDuration: 600,
    bigWinStages,
    // The end of a big win's reveal is spent standing on the final figure.
    bigWinHold: 1000,
};
