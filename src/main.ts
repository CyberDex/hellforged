import '@pixi/layout';
import { app } from 'controllers/app.controller';
import { game } from 'controllers/game.controller';
import { RootLayout } from 'layout/Root.layout';
import { mountUI } from 'ui/ui.controller';

await app.init();
await app.loadAssets(['default']);

export const layout = new RootLayout();

app.stage.addChild(layout);

game.init(layout);

mountUI(layout);
