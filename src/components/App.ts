import { Application, type ApplicationOptions, Assets } from 'pixi.js';

export class App extends Application {
    async init(options?: Partial<ApplicationOptions>) {
        await super.init({
            resizeTo: window,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio, 2),
            autoDensity: true,
            ...options,
        });
    }

    async loadAssets(bundles: string[] = []) {
        await Assets.init({
            manifest: 'manifest.json',
            basePath: 'assets',
        });

        await Assets.loadBundle(['default', ...bundles]);

        document.getElementById('loader')?.remove();
        document.body.appendChild(this.canvas);
    }
}
