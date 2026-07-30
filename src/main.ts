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
// After the game, which is what the keys go through: they only press what is
// already wired up and answering.
keyboard.init(layout);

await mountUI(layout);

// The dev panel is only there while the game is being worked on, and is loaded
// that way too: the branch is compiled out of a build, so Tweakpane is never
// bundled for, or shipped to, the player.
if (import.meta.env.DEV) {
    const { devTools } = await import('controllers/devTools.controller');

    devTools.init();
}
