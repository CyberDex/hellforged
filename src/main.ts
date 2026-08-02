import '@pixi/layout';
import { ApiController } from 'controllers/api.controller';
import { AppController } from 'controllers/app.controller';
import { GameController } from 'controllers/game.controller';
import { KeyboardController } from 'controllers/keyboard.controller';
import { SoundController } from 'controllers/sound.controller';
import { TweenController } from 'controllers/tween.controller';
import { RootLayout } from 'layout/Root.layout';
import { createGameStore } from 'store/game.store';
import { createGraphicsStore } from 'store/graphics.store';
import { createSoundStore } from 'store/sound.store';
import { mountUI } from 'ui/ui.controller';

const app = new AppController();
const api = new ApiController();
const gameStore = createGameStore();
const graphicsStore = createGraphicsStore();
const soundStore = createSoundStore();
const tween = new TweenController();
const sound = new SoundController(soundStore);
const game = new GameController({ api, sound, store: gameStore, tween });
const keyboard = new KeyboardController(game, sound);

tween.init();
sound.init();

await app.init();
await app.loadAssets(['default']);

export const layout = new RootLayout({ graphicsStore, sound, tween });

app.stage.addChild(layout);

game.init(layout);
// After the game: the keys only press what is already wired up.
keyboard.init(layout);

await mountUI({
    app,
    game,
    gameStore,
    graphicsStore,
    sound,
    soundStore,
    tween,
});

// Kept in the GitHub Pages preview; restore this guard for a production build
// so Tweakpane is not shipped to players.
// if (import.meta.env.DEV) {
const [
    { CheatsController },
    { DevToolsController },
    { RenderingPerformanceController },
] = await Promise.all([
    import('controllers/devTools/cheats.controller'),
    import('controllers/devTools/devTools.controller'),
    import('controllers/devTools/renderingPerformance.controller'),
]);

const cheats = new CheatsController(game, api, gameStore);
const renderingPerformance = new RenderingPerformanceController(app);
const devTools = new DevToolsController(cheats, renderingPerformance);

devTools.init();
// }
