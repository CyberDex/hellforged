import '@pixi/layout';
import { App } from './components/App';
import { RootLayout } from './layout/Root.layout';

const app = new App();

await app.init();
await app.loadAssets();

const rootLayout = new RootLayout();

app.stage.addChild(rootLayout);
