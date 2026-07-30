// What three of a kind pays, in bets, on the symbol the payline filled up with.
// This is also the set of symbols the game plays with, so every symbol on a reel
// is a symbol with a payout.
const three: Record<string, number> = {
    H1: 30,
    H2: 18,
    H3: 12,
    H4: 10,
    H5: 9,
};

// What a win has to pay to be revealed as a big one, in stages: a win falls
// into the last stage its amount reaches, and is held for that many times the
// usual reveal, so the more it pays the longer it is read out over. Each stage
// is announced by its own title as the count climbs through the figure it
// starts at, so the news gets bigger along with the number under it.
const bigWinStages = [
    { from: 1000, reveals: 2, title: 'BIG WIN' },
    { from: 10000, reveals: 3, title: 'MEGA WIN' },
    { from: 100000, reveals: 4, title: 'EPIC WIN' },
];

export const settings = {
    reels: 3,
    rows: 3,
    symbols: Object.keys(three),
    // What the player starts with, and what every spin costs.
    defaultBalance: 1000,
    defaultBet: 1,
    // The two ends of the bet slider: what a spin can be staked at, at least
    // and at most.
    minBet: 1,
    maxBet: 1000,
    // Bet multipliers for the payline: a single symbol pays nothing, a pair pays
    // flat whatever symbol it is, and three of a kind pays on its symbol.
    // Symbols land uniformly, so 1 spin in 25 fills the payline and 4 in 25
    // leave a pair, which pays back ~95% of what is staked over time.
    payouts: { two: 2, three },
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
    // A big win keeps the zoom it was built up to and is held for as long as
    // its stage above says, its amount counting up over all but the last of it.
    // The first stage is also what a win has to reach to be a big one at all:
    // the announcement changes over to it as the count climbs through that
    // figure, and coins shower off the number from there on.
    bigWinStages,
    // The end of a big win's reveal is spent standing on the figure the count
    // arrived at, so the amount is read in full before the reels jump back.
    bigWinHold: 1000,
};
