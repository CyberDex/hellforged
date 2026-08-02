import type { ApplicationOptions, ArrayOr } from 'pixi.js';
import { Application, Assets } from 'pixi.js';
import {
    getAssetResolutions,
    getRenderResolution,
} from 'utils/assetResolution';

export class AppController extends Application {
    async init(options?: Partial<ApplicationOptions>) {
        await super.init({
            resizeTo: window,
            antialias: true,
            resolution: getRenderResolution(),
            autoDensity: true,
            ...options,
        });
    }

    async loadAssets(bundles: ArrayOr<string>) {
        await Assets.init({
            manifest: 'manifest.json',
            basePath: 'assets',
            texturePreference: { resolution: getAssetResolutions() },
        });

        await Assets.loadBundle(bundles);

        document.getElementById('loader')?.remove();
        document.body.appendChild(this.canvas);
    }
}
