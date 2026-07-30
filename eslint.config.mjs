import js from '@eslint/js';
// Config, not plugin: this only switches off ESLint's stylistic rules so they
// can't contradict Prettier. Formatting itself is Prettier's job alone — running
// it through ESLint too makes the two fight on save.
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'public/assets'] },
    {
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            prettier,
        ],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            // The one quote rule Prettier can't cover: it rewrites " to ' but
            // never touches backticks. This flags template literals used where
            // a plain string would do. Kept in sync with Prettier's
            // singleQuote/avoidEscape behaviour so the two can't disagree.
            quotes: [
                'error',
                'single',
                { avoidEscape: true, allowTemplateLiterals: false },
            ],
        },
    },
);
