<p align="center">
  <a target="_blank" href="https://cyberdex.github.io/hellforged/">
    <img src="assets/static%7Bcopy%7D%7BmIgnore%7D/git.png" alt="Hellforged — click to play" width="640">
  </a>
</p>

## Run?
```
pnpm i && pnpm dev    # dev also mounts a draw-call panel + cheats, bottom right
pnpm sim [spins]      # spins the maths headlessly and reads back the return
pnpm build            # lint + typecheck run on pre-push
```

## Architecture?

```
 SpinButton · BetSlider · space/arrows · dev cheats              (input)
        │
        ▼
 ┌─────────────────┐  spin(bet)  ┌──────────────────────────────────────┐
 │ game.controller │────────────▶│ backend.controller — server stand-in │
 │ idle→spin→reveal│◀────────────│ answers a responseTime later, from   │
 └───────┬─────────┘ SpinResult, │ engine/engine.ts: pure maths over    │
         │ writes    while the   │ game.definition.ts (strips · rows ·  │
         ▼           reels turn  │ lines · paytable — all data)         │
 ┌──────────────────────────────┐└──────────────────────────────────────┘
 │ zustand stores: game         │      `pnpm sim` reads the same engine
 │ (persisted) · sound ·        │      with no browser: 95.2% measured RTP
 │ graphics                     │
 └───────┬──────────────┬───────┘
         │ one          │ useStore
         │ subscription │ selectors
         ▼              ▼
 ┌──────────────────────────┐  ┌─────────────────────────────────┐
 │ Pixi canvas — RootLayout │  │ React DOM overlay (see-through) │
 │ SlotMachine→Reels→Reel→  │  │ TopBar · Menu drawer ·          │
 │ Symbol · Pannels · Win · │  │ Balance · Rules sheet           │
 │ CoinShower · BG (shader) │  └─────────────────────────────────┘
 └──────────────────────────┘
 config: game.definition (what it plays) · game.settings (how it is paced) ·
 visual.settings (how it is dressed) · sound.settings — figures live here,
 not in components. All timed motion runs through the one tween.controller.
```

## Libraries

- **pixi.js 8** — renders and animates the machine; 
- **@pixi/layout** sizes the scene, 
- **@pixi/ui** backs the button and slider.
- **react 19** — DOM overlay above the canvas (top bar, menu, balance, rules). Never inside the Pixi tree; pointers fall through to the game.
- **zustand (vanilla)** — framework-free stores both worlds read; balance/bet/last result persist to `localStorage`.
- **howler** — sound, mixed in two channels from config.
- **tweakpane** — dev-only panel (draw-call graph, cheat spins), compiled out of production builds.
- **vite + assetpack** — build and asset pipeline: sprites packed into one atlas, audio transcoded, manifest generated. The `{tps}`/`{copy}`/`{m}` folder tags are AssetPack pipe instructions.

## Data flow

1. A press reaches `game.controller`; only `idle` takes it, so spamming cannot re-enter a spin.
2. The stake comes off the balance and the reels start turning at once; the spin goes out to `backend.controller` — a server stand-in that answers a `responseTime` round trip later with the whole outcome as data.
3. The reels only ever stop on an answer in hand — each is handed its column and lands exactly on it, left to right; the reels a win still hangs on are held out longer.
4. The last reel landing credits the win and stores the result; wins reveal over the reels with the cells they were paid for lit.
5. Everything on screen is written from the store — the controller's one subscription drives the Pixi side, React reads the same store — so no figure exists twice.

## Data

- **The machine is one piece of data**, `game.definition.ts`: the strip each reel is strung with (how often a symbol appears on it is the weighting), how many rows the window shows, the paylines as a row per reel, and the paytable (`full` per symbol, `partial` per run length). Another machine — wider, deeper, more lines, other odds — is another definition, not other code.
- **A spin is a `SpinResult`**: the grid, each win with the cells it was paid for (the reveal highlights from data), the total, and which reels to hold back. Pure data, no Pixi in it — the shape a real server would answer with, and what `pnpm sim` measures a million of.
- **Symbols are ids** (`H1`–`H5`): the keys of the paytable, resolved to atlas frames by name.
- **No churn in play**: each reel is a fixed pool of `rows + 1` sprites recycled by texture swap; the spin tick allocates nothing.

Every rule of the game, with the setting and the source file it lives in: [src/config/rules.md](src/config/rules.md).
