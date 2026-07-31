import js from '@eslint/js';
// Config, not plugin: this only switches off ESLint's stylistic rules so they
// can't contradict Prettier. Formatting itself is Prettier's job alone — running
// it through ESLint too makes the two fight on save.
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist'] },
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
        plugins: {
            import: importPlugin,
        },
        settings: {
            // Follows the tsconfig `paths` aliases, so no-cycle can walk
            // `controllers/*`-style imports and not just relative ones.
            'import/resolver': {
                typescript: true,
            },
            // no-cycle walks the graph by parsing each imported file itself;
            // without being told what parses TypeScript it fails on the first
            // `.ts` file — silently, reporting no cycles at all.
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
        },
        rules: {
            // The module-singleton controllers make an import cycle easy to
            // close by accident, and ES modules don't fail on one loudly: the
            // later module of the pair just sees an uninitialised binding,
            // which only blows up once someone touches it at module scope —
            // possibly months after the cycle itself was merged. Catch the
            // edge when it's drawn. `import type` edges are erased at compile
            // time and rightly don't count.
            'import/no-cycle': 'error',
            // Anything used only in type position must be imported with the
            // `import type` form, so the bundler can drop the import outright
            // instead of keeping a runtime dependency on a module we never
            // actually execute. Autofix splits a mixed import into a value
            // import plus a separate `import type` line.
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
            // Companion to the above: an import whose every specifier is
            // inline-marked (`import { type A, type B }`) still emits the
            // module for its side effects. Collapse it to `import type { A, B }`.
            '@typescript-eslint/no-import-type-side-effects': 'error',
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
