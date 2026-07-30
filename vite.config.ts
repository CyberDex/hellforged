import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import {
    AssetPack,
    stripTags,
    type AssetPackConfig,
    type AssetPipe,
} from '@assetpack/core';
import { pixiPipes } from '@assetpack/core/pixi';
import checker from 'vite-plugin-checker';

const assetsOutput = './dist/assets';

const preserveTransformedFolder: AssetPipe = {
    name: 'preserve-transformed-folder',
    defaultOptions: {},
    test: (asset) => !asset.isFolder && asset.rootTransformAsset.isFolder,
    transform: async (asset, _options, pipeSystem) => {
        const sourceFolder = asset.rootTransformAsset;
        const outputDirectory = join(
            pipeSystem.outputPath,
            stripTags(relative(pipeSystem.entryPath, sourceFolder.path)),
        );
        const outputPath = join(outputDirectory, asset.filename);

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, asset.buffer);

        asset.path = outputPath;

        return [];
    },
};

const assetpackConfig: AssetPackConfig = {
    entry: './assets',
    output: assetsOutput,
    cache: false,
    ignore: ['**/.DS_Store', '**/.gitkeep', '**/*.md'],
    pipes: [
        ...pixiPipes({
            cacheBust: true,
            resolutions: { default: 1, low: 0.5 },
            compression: { png: true, jpg: true, webp: true, avif: false },
            texturePacker: {
                texturePacker: {
                    nameStyle: 'short',
                    removeFileExtension: true,
                    padding: 2,
                    allowTrim: true,
                },
                resolutionOptions: {
                    maximumTextureSize: 2048,
                },
            },
            manifest: {
                createShortcuts: true,
                includeMetaData: false,
                trimExtensions: true,
            },
            audio: {
                inputs: ['.mp3', '.ogg', '.wav'],
                outputs: [
                    {
                        formats: ['.mp3'],
                        recompress: false,
                        options: {
                            audioBitrate: 96,
                            audioChannels: 1,
                            audioFrequency: 48000,
                        },
                    },
                    {
                        formats: ['.ogg'],
                        recompress: false,
                        options: {
                            audioBitrate: 32,
                            audioChannels: 1,
                            audioFrequency: 22050,
                        },
                    },
                ],
            },
        }),
        preserveTransformedFolder,
    ],
};

function assetpackPlugin(): Plugin {
    let ap: AssetPack | undefined;
    let isBuild = false;

    return {
        name: 'vite-plugin-assetpack',
        configResolved: async ({ command }) => {
            isBuild = command !== 'serve';

            if (isBuild || ap) return;

            ap = new AssetPack(assetpackConfig);

            await ap.watch();
        },
        configureServer: (server) => {
            // The generated assets sit inside `build.outDir`, which both
            // `publicDir` and the dev watcher deliberately ignore, so Vite
            // would never serve them. Rewriting to the real path hands the
            // request to Vite's static middleware while the app keeps
            // requesting the same `assets/...` URL it does in production.
            server.middlewares.use((req, _res, next) => {
                if (req.url?.startsWith('/assets/')) {
                    req.url = `/dist${req.url}`;
                }

                next();
            });
        },
        buildEnd: async () => {
            if (ap) {
                await ap.stop();
                ap = undefined;
            }
        },
        // A build empties `dist` before writing the bundle, so the assets can
        // only be generated once that is done.
        closeBundle: async () => {
            if (!isBuild) return;

            await new AssetPack(assetpackConfig).run();
        },
    };
}

export default defineConfig((): UserConfig => ({
    base: './',
    // Nothing left to copy: the asset folder is AssetPack's, and it wipes that
    // folder on every run.
    publicDir: false,
    server: {
        port: 8080,
        open: true,
    },
    // Pixi + top-level await in main.ts need a modern output target.
    build: {
        target: 'esnext',
        // Keeps Vite's own output clear of the generated assets — entry,
        // chunks, CSS and imported files all land in `dist/js`.
        assetsDir: 'js',
    },
    plugins: [
        assetpackPlugin(),
        checker({
            typescript: true,
            eslint: {
                lintCommand: 'eslint "**/*.{ts,tsx}"',
            },
            overlay: false,
            terminal: true,
            enableBuild: false,
        }),
    ],
}));
