import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    define: {
        __GAME_NAME__: JSON.stringify('hellforged-test'),
        __GAME_TITLE__: JSON.stringify('Hellforged Test'),
    },
    resolve: {
        alias: {
            config: fileURLToPath(new URL('./src/config', import.meta.url)),
        },
    },
    test: {
        include: ['src/**/*.test.ts'],
    },
});
