import '@pixi/layout';
import { app } from './controllers/app.controller';
import { game } from './controllers/game.controller';
import { sound } from './controllers/sound.controller';
import { RootLayout } from './layout/Root.layout';

await app.init();
await app.loadAssets(['default']);

export const layout = new RootLayout();

app.stage.addChild(layout);

game.init(layout);

sound.play('music');
