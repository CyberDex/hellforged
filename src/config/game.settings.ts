export const settings = {
    reels: 3,
    rows: 3,
    symbols: ['H1', 'H2', 'H3', 'H4', 'H5'],
    // What the player starts with, and what every spin costs.
    defaultBalance: 1000,
    defaultBet: 1,
    // Bet multipliers for the payline: a single symbol pays nothing, two of a
    // kind pay x10 and three pay x100.
    payouts: { two: 10, three: 100 },
    // How fast the reel strip travels, in symbols per second.
    spinSpeed: 20,
    // How far a landing reel dips past the row grid, in symbols, and how long
    // it takes to dip and come back. Keep the distance under one symbol.
    bounceDistance: 0.15,
    bounceDuration: 220,
    spinDuration: 500,
    reelStopDelay: 550,
    // A spin whose payline can still fill up holds its last reel back for this
    // many times the spin it would have had, and the reels grow to this scale
    // over the wait before snapping back.
    anticipationSpins: 2,
    anticipationZoom: 1.1,
    // Only a win is revealed; a losing spin returns to idle at once. The win
    // is held for this long, and its amount counts up over the first part.
    winDuration: 2500,
    winCountDuration: 800,
};
