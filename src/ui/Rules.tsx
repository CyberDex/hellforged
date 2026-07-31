import { Suspense, use, useEffect } from 'react';
import { marked } from 'marked';
import { Sprite, Texture } from 'pixi.js';
import { settings } from 'config/game.settings';
import { definition, symbols } from 'config/game.definition';
import { app } from 'controllers/app.controller';
import { Button } from 'ui/Button';
import { formatAmount } from 'utils/formatAmount';

// The player's rules ship with the art, so a reskin brings its own;
// `src/config/rules.md` is the working copy. Fetched: a DOM-only document has
// no business on Pixi's manifest (`mIgnore` — see `vite.config.ts`).
const copy = fetch('assets/rules/rules.md').then((response) => response.text());

// Filled from the settings the game is played on, so the paytable cannot
// disagree with the reels. Written out whole: Prettier folds a placeholder
// standing in a table into a cell of its own.
const figures: Record<string, string> = {
    '%PAYTABLE%': [
        `| Symbol | ${definition.strips.length} of a kind |`,
        '| ------ | --------------- |',
        ...Object.entries(definition.payouts.full).map(
            ([symbol, payout]) => `| ${symbol} | ${payout} x bet |`,
        ),
    ].join('\n'),
    '%PAIR%': (definition.payouts.partial[2] ?? 0).toString(),
    '%MINBET%': formatAmount(settings.minBet),
    '%MAXBET%': formatAmount(settings.maxBet),
};

// Symbol names in the document are swapped for the faces the game is dressed
// in, cut out of the art at runtime.
const names = new RegExp(`\\b(?:${symbols.join('|')})\\b`, 'g');

// The sheet's frames are trimmed and rotated to pack, so the symbol is drawn
// through a sprite to put it back upright inside its square.
const face = (symbol: string) => {
    const source = app.renderer.extract
        .canvas(new Sprite(Texture.from(symbol)))
        .toDataURL?.();

    return source
        ? `<img class="symbol" src="${source}" alt="${symbol}">`
        : symbol;
};

// Rendered on first open — module load happens before there is a renderer to
// cut symbols from.
let html: string | undefined;

const rendered = (source: string) =>
    (html ??= marked.parse(
        source
            .replace(/%\w+%/g, (name) => figures[name] ?? name)
            // After the figures: the paytable is only there once filled in.
            .replace(names, face),
        { async: false },
    ));

function Body() {
    return (
        // The document ships with the game's own assets; not player-written.
        <div
            className="rules-body"
            dangerouslySetInnerHTML={{ __html: rendered(use(copy)) }}
        />
    );
}

export function Rules({ onClose }: { onClose: () => void }) {
    // The sheet takes the drawer's place, so Escape is only listened for once.
    useEffect(() => {
        const close = ({ key }: KeyboardEvent) => {
            if (key === 'Escape') onClose();
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [onClose]);

    return (
        <>
            <div className="veil" onClick={onClose} />
            <div className="rules glass" role="dialog" aria-label="Game rules">
                <div className="rules-head">
                    <span className="rules-title gold">Game rules</span>
                    <Button
                        className="rules-close gold"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ×
                    </Button>
                </div>
                <Suspense fallback={<div className="rules-body" />}>
                    <Body />
                </Suspense>
            </div>
        </>
    );
}
