import '@pixi/layout';
import { app } from 'controllers/app.controller';
import { game } from 'controllers/game.controller';
import { keyboard } from 'controllers/keyboard.controller';
import { RootLayout } from 'layout/Root.layout';
import { mountUI } from 'ui/ui.controller';

await app.init();
await app.loadAssets(['default']);

export const layout = new RootLayout();

app.stage.addChild(layout);

game.init(layout);
// After the game: the keys only press what is already wired up.
keyboard.init(layout);

await mountUI(layout);

// Compiled out of a build, so Tweakpane is never shipped to the player.
// TODO: this is available for git pages, uncomment lines before go to prod!!!
// if (import.meta.env.DEV) {
const { devTools } = await import('controllers/devTools.controller');

devTools.init();
// }
