// What a full payline pays, in bets, on the symbol it filled up with. This is
// also the set of symbols the game plays with, so every symbol on a reel is a
// symbol with a payout.
const full: Record<string, number> = {
    H1: 30,
    H2: 18,
    H3: 12,
    H4: 10,
    H5: 9,
};

// What a win short of a full payline pays, in bets, by the number of reels its
// run covers. Flat, whatever the symbol: only a filled line reads the symbol.
// A run is paid at the longest length listed here that it reaches, so a run
// shorter than the shortest listed pays nothing, and a reel added to the game
// leaves no run unpriced — though a wider machine wants a rung of its own for
// each new length rather than paying four in a row what a pair pays.
const partial: Record<number, number> = {
    2: 2,
};

// What a key is worth to the bet, in steps of the slider: up and down nudge it
// one figure at a time, and left and right run it ten at a time (see
// `keyboard.controller.ts`).
const betSteps: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    ArrowRight: 10,
    ArrowLeft: -10,
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
    symbols: Object.keys(full),
    // What the player starts with, and what every spin costs.
    defaultBalance: 1000000,
    defaultBet: 1,
    // The two ends of the bet slider: what a spin can be staked at, at least
    // and at most.
    minBet: 1,
    maxBet: 1000000,
    // How the bet is set from the keyboard: what each arrow moves it by, and
    // what holding command multiplies whichever arrow by, so the same four keys
    // also run it a hundred and a thousand figures at a time. A bet that runs
    // to a million is a long way up in ones.
    betSteps,
    betStepCommand: 100,
    // Bet multipliers for the payline: a win is the run of one symbol the line
    // opens on, paid flat at whatever length it reaches short of the whole line
    // and on its own symbol once it fills, so a single symbol pays nothing at
    // any width of machine. Symbols land uniformly, so on the 3x3 the game
    // ships as, 1 spin in 25 fills the payline and 4 in 25 leave a pair, which
    // pays back ~95% of what is staked over time. A grid of another size pays
    // back something else, and the rungs above are what settles it.
    payouts: { partial, full },
    // How fast the reel strip travels, in symbols per second.
    spinSpeed: 20,
    // How far a landing reel dips past the row grid, in symbols, and how long
    // it takes to dip and come back. Keep the distance under one symbol. The
    // share of that time spent travelling down is the last of the three: the
    // rest eases back up, so the return is the slower half.
    bounceDistance: 0.15,
    bounceDuration: 220,
    bounceDown: 0.4,
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
    // How long the top bar takes to count the balance to whatever it has
    // changed to, in either direction, rather than printing the new figure.
    balanceCountDuration: 600,
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
