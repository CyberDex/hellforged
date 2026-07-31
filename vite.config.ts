import { readdirSync, readFileSync } from 'node:fs';
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
import react from '@vitejs/plugin-react';
import sharp from 'sharp';

const assetsEntry = './assets';
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

// The tab icon is cut from the logo the game already ships in `assets`, rather
// than from a `favicon.png` kept in step by hand — so a reskin that drops its
// own logo in there is wearing its own favicon by the next build.
const faviconSize = 64;

function faviconPlugin(): Plugin {
    let png: Promise<Buffer> | undefined;

    // The logo wherever it is filed under `assets`: the folder it sits in
    // carries an AssetPack tag that a reskin is free to move it out of, and the
    // extension is as likely to come off a camera roll shouting `.PNG`.
    function render(): Promise<Buffer> {
        const entry = fileURLToPath(new URL(assetsEntry, import.meta.url));
        const logo = readdirSync(entry, { recursive: true })
            .map(String)
            .find((file) => /(^|\/)logo\.(png|jpe?g|webp)$/i.test(file));

        if (!logo) {
            return Promise.reject(
                new Error(`no logo.png found under ${assetsEntry}`),
            );
        }

        return sharp(join(entry, logo))
            .resize(faviconSize, faviconSize, {
                fit: 'contain',
                // Whatever the logo does not cover stays see-through, so the
                // icon reads on a light tab strip as well as a dark one.
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
    }

    // Rendered once per Vite run, and only if something asks for the file.
    const favicon = () => (png ??= render());

    return {
        name: 'vite-plugin-favicon',
        configureServer: (server) => {
            // Nothing is served from a `public` folder (see `publicDir`), so
            // dev hands the browser the same bytes a build would write out.
            server.middlewares.use('/favicon.png', (_req, res, next) => {
                favicon().then((buffer) => {
                    res.setHeader('Content-Type', 'image/png');
                    res.end(buffer);
                }, next);
            });
        },
        generateBundle: async function () {
            this.emitFile({
                type: 'asset',
                fileName: 'favicon.png',
                source: await favicon(),
            });
        },
    };
}

// Bare-specifier imports for the top-level `src` folders, so nothing has to
// count `../` hops. Keep in sync with `paths` in tsconfig.json.
const srcAliases = Object.fromEntries(
    [
        'config',
        'controllers',
        'filters',
        'layout',
        'math',
        'store',
        'ui',
        'utils',
    ].map((folder) => [
        folder,
        fileURLToPath(new URL(`./src/${folder}`, import.meta.url)),
    ]),
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
    entry: assetsEntry,
    output: assetsOutput,
    cache: false,
    // Not everything the game is dressed in goes on the reels. The manifest is
    // Pixi's list of what to load into the renderer, so a file the DOM reads for
    // itself is tagged `{mIgnore}`: it is still copied out with the art, so a
    // reskin brings its own along with its sprites, but it is left off that list
    // and fetched at the path it lands at instead. Two folders are that way —
    // the rules document (`src/ui/Rules.tsx`) and the palette the overlay is
    // dressed from (`src/ui/ui.controller.tsx`).
    //
    // And what the running game never reads at all is kept out of the build
    // altogether: a README beside a folder of sprites is a note about the art
    // rather than part of it, and `static` holds the screenshot that README
    // shows and the logo the favicon is cut from — both of them read here at
    // build time, off the source folder, rather than served to anybody.
    ignore: [
        '**/.DS_Store',
        '**/.gitkeep',
        '**/README.md',
        '**/static{copy}{mIgnore}/**',
    ],
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
                    // Recompressed even when the source already is the format,
                    // so a heavy master shipped as .mp3 leaves at the mix's
                    // own bitrate rather than as it came in.
                    {
                        formats: ['.mp3'],
                        recompress: true,
                        options: {
                            audioBitrate: 96,
                            audioChannels: 1,
                            audioFrequency: 48000,
                        },
                    },
                    {
                        formats: ['.ogg'],
                        recompress: true,
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
        faviconPlugin(),
        assetpackPlugin(),
        // Vite builds the overlay's JSX without this, but every edit to a
        // component reloads the page — which drops the game back to a fresh
        // load. This keeps the reels where they are and swaps the UI in place.
        react(),
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
