# Game Rules

A 3x3 slot with a single payline.

## Grid

- 3 reels, 3 rows (`settings.reels`, `settings.rows`).
- Only the **middle row** participates in wins — one symbol per reel, 3 symbols total.
- The **top** and **bottom** rows are purely visual (they exist to show the reel strip). They never form or extend a win.

## Symbols

Five symbols, no wilds or scatters:

`H1`, `H2`, `H3`, `H4`, `H5` (`settings.symbols`)

They differ only in what three of them pay, `H1` the most and `H5` the least (`settings.payouts.three`, which is where the symbol list itself comes from — a symbol on a reel is a symbol with a payout).

Each spin picks symbols independently and uniformly at random (see `src/utils/getRandomSymbol.ts`), so every symbol has the same 1-in-5 chance in every slot.

## Outcome

The spin is decided in full before a reel has moved, by `src/controllers/backend.controller.ts` — it stands in for the server. It rolls the whole 3x3 grid and works out what the payline pays; the reels only play that grid back. Each reel is handed its three symbols when it is asked to stop and lands on exactly those, so nothing about the result depends on the animation.

## Balance

- The player starts with `settings.defaultBalance` and every spin stakes the bet.
- The balance is read out on the top bar (`src/ui/TopBar.tsx`), which is hung off the top of the page at the width the reels measure, alongside the game name, the time of day and how long the session has been open. It is DOM rather than canvas, and follows the same store the reels are played from, so it never has a balance of its own to keep in step. Its colours are filed with the art (`assets/theme{copy}{mIgnore}/theme.json`) and fetched as the overlay's own module is loaded, so a new set of sprites brings the palette the bar is dressed in along with it. Like the rules document, the palette is copied out with the art but kept off the manifest: that list is what Pixi loads onto the reels, and nothing but the DOM ever reads either file.
- The bar counts to a balance rather than printing it: every change is climbed to over `settings.balanceCountDuration`, in whole coins and in either direction, so a stake is watched coming off and a win going on. The count runs on the game's own clock — the one the win over the reels is counted up on — so both figures move on the frames the reels are drawn on. A change part way through a count carries on from the figure on screen rather than from the one it was climbing to, and a session opens on the balance it was left at, with nothing to count from. Only the reading of the balance is ever behind: the store is the balance, and it is what every spin is staked from and every cap worked out against.
- The balance can also be set by hand, on the pop up the balance on the bar opens (`src/ui/Balance.tsx`), which the menu is a second way in to. What is typed there is whole and never below zero, and the game settles around it the way it settles after a spin: the top of the slider comes down to it, and a balance that had run out is playable again. A figure set while the reels are still turning goes onto the balance at once but only settles the machine as that spin ends, since its stake was taken and its win worked out before the change.
- The bet is set on the slider under the `Bet` pannel, which runs from `settings.minBet` to `settings.maxBet` (currently 1 to 1000) a unit at a time and opens at `settings.defaultBet`. The pannel reads out whatever it is dragged to.
- `settings.maxBet` is only the widest the slider ever opens. A bet can never be staked higher than the balance covers, so the top of the slider is whichever is lower of `settings.maxBet` and the balance, and it comes down as the balance does. A bet already above the new top comes down to it, pannel and all.
- The slider always keeps `settings.minBet` at the bottom, whatever the balance is: the last of a balance is still staked at the minimum, and a balance too small to cover even that is out of funds (see [Running out](#running-out)) rather than a smaller bet.
- The top is only moved between spins. The stake comes off the balance the moment the reels start, and the bet that spin was paid for stays on the pannel until it is over, so the new top is worked out as the game returns to idle.
- The slider is hidden from the moment the reels start until the game is back to idle: the stake has already been taken, and the win still to come was worked out from it, so there is no bet to set and nothing is left on the machine to drag. The `Bet` pannel above it stays up throughout and keeps reading out what the spin was staked at.
- The stake is taken the moment the reels start; a win is credited once the last reel has stopped.
- A spin is refused while the balance is below the bet.
- The balance and the bet are kept in the browser (`localStorage`, under `<game name>.player` — the game is named once, by `name` in package.json, and reaches the code as `gameName`), so a reload picks the player up where they left off rather than handing them a fresh `settings.defaultBalance`. The last spin is kept with them — the symbols the reels landed on and the win they paid — so the game opens on the spin the player left rather than on symbols it never landed on. The game state is not kept: a spin cut off by a reload is over, so a session always opens idle. Clearing site data starts a new player.
- A stored bet the stored balance no longer covers is brought down to it before the first press, the same as it would be after a spin.
- The stake is taken as the reels start and the win is credited as they finish, so a reload in between keeps the balance as the stake left it: the spin is paid for and its win is gone with it.

## Running out

- A balance that no longer covers `settings.minBet` can never be staked again, so it is not left sitting there as money the player has: it is emptied to zero. With whole bets and whole payouts a losing balance lands on zero of its own accord; the emptying is what settles anything a fractional setting leaves behind.
- The spin button is disabled and the bet slider hidden with it, the same as during a spin. Nothing on the machine answers again until there is a balance to stake.
- The `Bet` pannel empties to the same dash the `Win` pannel sits at between spins. The bet itself is kept — the slider has to open somewhere if a balance ever comes back — but nothing can be staked at it, so it is not read out as though it could. This is the one time the bet is not on the pannel: a running spin keeps reading out what it was paid for.
- The game says why over the middle of the reels, in the place a win is announced (`src/layout/Win.layout.ts`): `OUT OF` over `FUNDS`, in the two lines a win would have used for `WIN` over its amount. It goes up as the spin that emptied the balance returns to idle, and stays up — there is no next spin to take it down.
- It is worked out between spins, alongside the top of the slider, and again before the first press of a session, so a stored balance that has already run out opens the game locked with the message up.
- Setting a balance on the balance pop up is the way back: the message comes down, the `Bet` pannel reads its bet out again, and the button and the slider come back, all settled exactly as they are between spins.

## Spin

- All reels start spinning at the same moment.
- They stop one at a time, **left to right**, with a configurable delay between each stop (`settings.reelStopDelay`).
- The first reel stops after `settings.spinDuration`; each following reel stops one delay later. Total spin length is therefore `spinDuration + (reels - 1) * reelStopDelay` — unless the last reel is held back (see [Anticipation](#anticipation)).
- Setting `reelStopDelay` to `0` makes all reels stop together.
- The strip travels at `settings.spinSpeed` symbols per second (currently 20).
- A reel does not halt on the spot: it keeps sliding until it has fed its three outcome symbols in on top and lined them back up with the row grid, which takes up to four symbols of travel. Keep `reelStopDelay` above that worst case (`(rows + 1) * 1000 / spinSpeed`, currently 200ms) or the stop order can blur.
- Landing ends with a pushback: the strip dips `settings.bounceDistance` of a symbol below the row grid and eases back up over `settings.bounceDuration`. It is cosmetic — the reel counts as stopped the moment it reaches the grid, before the dip.
- The spin is considered over once the last reel stops; only then is the win evaluated.

## Anticipation

- When every reel but the last has landed on the same payline symbol, three of a kind is still in play and the last reel is drawn out: it spins `settings.anticipationSpins` times as long as it otherwise would (currently 2, so 3200ms instead of 1600ms).
- Everything but the background is zoomed in over the wait: the machine, the pannels and the spin button all grow together to `settings.anticipationZoom` of their size, evenly, about the middle of the screen, so the game fills more of it the longer the last reel holds out. The rows show the same amount of themselves throughout — the reel window grows with them — and the background is left where it is, still behind the zoom.
- The zoom runs from the moment the reel before the held-back one lands until the held-back one lands, and is fully in by the time it does. What happens next is the only thing about the anticipation that depends on the outcome:
    - **The last symbol misses** — the reels jump straight back out to size, with none of the travel the zoom had, and the pair is paid at normal size.
    - **The last symbol matches** — the zoom is held. The reveal comes up inside it and the game only drops back to size when it returns to idle (see [Showing a win](#showing-a-win)).
- `anticipation` plays once as the zoom starts, over the spin loop.
- A pair on the first two reels always draws the third reel out, whether it lands on the match or not. The outcome is decided before the reels move, so the anticipation is only ever a build-up and never says how the spin ends.

## Winning

Evaluated on the middle row only:

| Middle row                          | Pays                                              |
| ----------------------------------- | ------------------------------------------------- |
| 3 matching symbols                  | bet x the symbol's own (`settings.payouts.three`) |
| First two matching, third different | bet x 2 (`settings.payouts.two`)                  |
| First two different                 | nothing                                           |

Three of a kind pays on the symbol it filled up with:

| Symbol | Pays     |
| ------ | -------- |
| `H1`   | bet x 30 |
| `H2`   | bet x 18 |
| `H3`   | bet x 12 |
| `H4`   | bet x 10 |
| `H5`   | bet x 9  |

- One matching symbol on its own pays nothing.
- A win has to start on the first reel, so a pair only counts on reels 1 and 2. A pair on reels 2 and 3 pays nothing, and neither does a first-and-third match.
- Only one win is paid per spin: three of a kind pays on its symbol instead of, not in addition to, the pair it contains.
- The win amount scales with the bet.
- A pair pays the same whatever symbol it is; only three of a kind reads the symbol.
- The payouts live in `src/config/game.settings.ts` alongside the rest of the game config.
- Every symbol is as likely as every other, so the payline fills up on 1 spin in 25 and leaves a pair on 4 in 25. Between them the table pays back about 95% of what is staked over time (`(30+18+12+10+9)/125 + 0.16 x 2`), so a balance drifts down rather than either way.

## Showing a win

- The `Win` pannel takes the amount as soon as the last reel has stopped, and keeps it until the next spin starts.
- A winning spin is also announced over the middle of the reels (`src/layout/Win.layout.ts`), with the amount counting up from zero rather than printed.
- A pair is held for `settings.winDuration` and counts up over `settings.winCountDuration` of it, so the amount settles well before the announcement comes down.
- Three of a kind is held for `settings.bigWinReveals` times as long (currently 2, so 5000ms) and counts up over that whole time, so the number is still climbing to the top win for as long as it is up. It is read out from inside the anticipation zoom, which is only dropped once the reveal is over.
- A win worth `settings.bigWinAmount` or more (currently 1000) is announced as `BIG WIN` rather than `WIN`. It is the climbing figure that changes it over rather than the win it is climbing to, so the announcement is rewritten mid-count, on the frame the number passes it — the amount, not the symbols, decides it, so a pair at a high enough bet is a big win and three of a kind at the minimum is not.
- From that figure on, coins shower out from behind the announcement (`src/layout/components/CoinShower.ts`): one is thrown off the number for every figure the count climbs through — the same beat the coin is heard on — up out of wherever the amount currently reads, spinning about its own upright, and pulled back down under its own weight. The shower ends with the count, the last coins falling out of it, and anything still in the air when the announcement is written over or comes down goes with it.
- The announcement comes down when the game returns to idle and the spin button unlocks — unless that spin was the last the balance could pay for, in which case the out-of-funds message goes up in its place (see [Running out](#running-out)).
- A losing spin has no reveal at all: the game returns to idle the moment the last reel lands, so the spin button is ready again with no wait.

## Menu

- The bar opens a menu on its left (`src/ui/Menu.tsx`): what is set about the game rather than played of it. Everything on it is the player's own and is kept in the browser (`localStorage`, under `<game name>.sound`), the way the balance and the bet are.
- `Sound` switches the whole game silent and back. Muting silences without stopping: the music keeps its place and a running spin keeps its loop, so unmuting picks the game up where it got to rather than starting anything again.
- `Music` and `Effects` are set apart from one another, from nothing up to full. Every sound is filed under one of the two channels with its own level in the mix (`src/config/sound.settings.ts`), and the slider for its channel brings that level down — so the mix is balanced once, in the config, and the player only ever turns it down from there.
- A volume is heard on what is already playing rather than on the next spin: the music follows its slider as it moves, and the effects slider clicks at the level it is let go on, since nothing else on screen says how loud they have been set.
- The menu is also the second way in to the balance pop up (see [Balance](#balance)).
- `Game rules` opens the rules the player is told (`src/ui/Rules.tsx`), which are their own document — `assets/rules{copy}{mIgnore}/rules.md`, filed with the art the game is dressed in, so a reskin brings its own rules along with its own sprites. It is copied out with the art but kept off the manifest, which is the list of what Pixi loads onto the reels: this document is only ever read by the DOM, so the sheet fetches it itself as its module is loaded and nothing about markdown reaches the game's loader. This file is the same game written out for whoever works on it, down to the setting and the source file each rule lives in, which is not what somebody who only wants to know what a symbol pays came to read.
- The figures are the one thing that document does not spell out for itself: the paytable, the pair, and the two ends of the slider are filled into it from `src/config/game.settings.ts`, so what the player is told a symbol pays is read off the same setting the win is worked out from and cannot drift from it. The return in it is prose, and is the one figure a change to the payouts has to be walked back to by hand.
- The symbols are shown rather than named. The document writes a symbol as the `H1` the settings and the reels know it by, and every one of them is swapped for the face the game is dressed in as the sheet is rendered — cut out of the loaded spritesheet through `renderer.extract`, so a reskin's paytable is filled with its own art and neither the document nor `src/ui/Rules.tsx` is touched for it. This runs after the figures, so the paytable's own column of names is swapped along with anything written by hand. The sprites are packed trimmed and turned on their side, so a face is drawn through a sprite rather than lifted out of the sheet by its frame: that puts it back the way up it is played and back inside the square all of them are cut from, and they come out one size down the table.
- It is the one sheet not cut to the reels in both directions: it holds more than fits, so it takes their width, is capped at the screen, and is scrolled.
