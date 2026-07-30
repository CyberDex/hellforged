import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
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

// The game is named once, by `name` in package.json, and reaches the rest of
// the app from here: `define` hands the two constants to `config/game.name.ts`,
// and the `%GAME_NAME%` / `%GAME_TITLE%` placeholders in index.html are filled
// in below. Reskinning this app as another slot renames it in that one place.
const { name: gameName } = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { name: string };

// The slug spelled out for the player: `dead-mans-gold` -> `Dead Mans Gold`.
const gameTitle = gameName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

function gameNamePlugin(): Plugin {
    return {
        name: 'vite-plugin-game-name',
        transformIndexHtml: {
            // Ahead of Vite's own `%...%` pass, which warns on placeholders it
            // has no env variable for.
            order: 'pre',
            handler: (html) =>
                html
                    .replaceAll('%GAME_TITLE%', gameTitle)
                    .replaceAll('%GAME_NAME%', gameName),
        },
    };
}

// Bare-specifier imports for the top-level `src` folders, so nothing has to
// count `../` hops. Keep in sync with `paths` in tsconfig.json.
const srcAliases = Object.fromEntries(
    ['config', 'controllers', 'filters', 'layout', 'store', 'utils'].map(
        (folder) => [
            folder,
            fileURLToPath(new URL(`./src/${folder}`, import.meta.url)),
        ],
    ),
);

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
                trimExtensions: true,
                // Cache busting puts a hash in the filename, and Pixi names a
                // web font after the file it came from — so the family would
                // change on every build. The `{wf}` pipe pins it to the name
                // the font is filed under, and that only reaches the loader as
                // `data.family` with the metadata written out flat rather than
                // under `data.tags`.
                includeMetaData: true,
                legacyMetaDataOutput: false,
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
        closeBundle: async () => {
            if (!isBuild) return;

            await new AssetPack(assetpackConfig).run();
        },
    };
}

export default defineConfig((): UserConfig => ({
    base: './',
    publicDir: false,
    define: {
        __GAME_NAME__: JSON.stringify(gameName),
        __GAME_TITLE__: JSON.stringify(gameTitle),
    },
    resolve: {
        alias: srcAliases,
    },
    server: {
        port: 8080,
        open: true,
    },
    build: {
        target: 'esnext',
        assetsDir: 'js',
        rollupOptions: {
            output: {
                // Keeps Pixi out of the entry chunk. Sharing one, its lazy
                // renderer chunks import the entry back, and the top-level
                // await in `main.ts` has that entry suspended — so `app.init()`
                // deadlocks and the build hangs on the loader with no error.
                // Dev is unaffected: nothing is bundled there.
                manualChunks: (id) =>
                    id.includes('node_modules/pixi.js') ? 'pixi' : undefined,
            },
        },
    },
    plugins: [
        gameNamePlugin(),
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
