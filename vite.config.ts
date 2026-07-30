import { defineConfig, type Plugin } from 'vite';
import { AssetPack, type AssetPackConfig } from '@assetpack/core';
import { pixiPipes } from '@assetpack/core/pixi';

// Folder/file name tags drive this pipeline — see `assets/README.md`.
// `{tps}` packs a folder into an atlas, `{m}` makes a folder its own bundle,
// `{nomip}`/`{fix}`/`{nc}` opt individual assets out of scaling/compression.
const assetpackConfig: AssetPackConfig = {
    entry: './assets',
    output: './public/assets',
    cache: false,
    // Housekeeping files would otherwise be copied out and listed in the manifest.
    ignore: ['**/.DS_Store', '**/.gitkeep', '**/*.md'],
    pipes: pixiPipes({
        // Hashed filenames so `public/assets` can be served immutable.
        cacheBust: true,
        // Every image also gets an `@0.5x` variant for low-DPI / low-end devices.
        resolutions: { default: 1, low: 0.5 },
        compression: { png: true, jpg: true, webp: true, avif: false },
        texturePacker: {
            texturePacker: {
                // Frames are addressed by bare basename: `Sprite.from('spin-button')`.
                nameStyle: 'short',
                removeFileExtension: true,
                padding: 2,
                allowTrim: true,
            },
            resolutionOptions: {
                // Keep sheets within the safe limit for mobile GPUs; extra
                // sprites spill into a second page rather than a 4096 sheet.
                maximumTextureSize: 2048,
            },
        },
        manifest: {
            createShortcuts: true,
            includeMetaData: false,
            trimExtensions: true,
        },
    }),
};

function assetpackPlugin(): Plugin {
    let ap: AssetPack | undefined;

    return {
        name: 'vite-plugin-assetpack',
        configResolved: async ({ command }) => {
            if (command !== 'serve') {
                await new AssetPack(assetpackConfig).run();
                return;
            }

            if (ap) return;

            ap = new AssetPack(assetpackConfig);

            await ap.watch();
        },
        buildEnd: async () => {
            if (ap) {
                await ap.stop();
                ap = undefined;
            }
        },
    };
}

export default defineConfig(() => ({
    base: './',
    server: {
        port: 8080,
        open: true,
    },
    // Pixi + top-level await in main.ts need a modern output target.
    build: {
        target: 'esnext',
    },
    plugins: [assetpackPlugin()],
}));
