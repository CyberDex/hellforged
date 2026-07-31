import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

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

export default defineConfig({
    define: {
        __GAME_NAME__: JSON.stringify('hellforged-test'),
        __GAME_TITLE__: JSON.stringify('Hellforged Test'),
    },
    resolve: {
        alias: srcAliases,
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
