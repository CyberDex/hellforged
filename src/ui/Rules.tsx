import { Component, Suspense, use, useEffect } from 'react';
import type { ReactNode } from 'react';
import { marked } from 'marked';
import { Sprite, Texture } from 'pixi.js';
import { gmeSettings } from 'config/game.settings';
import { gameDefinition, symbols } from 'config/game.definition';
import { app } from 'controllers/app.controller';
import { Button } from 'ui/Button';
import { formatAmount } from 'utils/formatAmount';

// The player's rules ship with the art, so a reskin brings its own;
// `src/config/rules.md` is the working copy. Fetched: a DOM-only document has
// no business on Pixi's manifest (`mIgnore` — see `vite.config.ts`).
const copy = fetch('assets/rules/rules.md').then((response) => {
    if (!response.ok) {
        throw new Error(`Unable to load game rules (${response.status}).`);
    }

    return response.text();
});

// Filled from the settings the game is played on, so the paytable cannot
// disagree with the reels. Written out whole: Prettier folds a placeholder
// standing in a table into a cell of its own.
const figures: Record<string, string> = {
    '%PAYTABLE%': [
        `| Symbol | ${gameDefinition.strips.length} of a kind |`,
        '| ------ | --------------- |',
        ...Object.entries(gameDefinition.payouts.full).map(
            ([symbol, payout]) => `| ${symbol} | ${payout} x bet |`,
        ),
    ].join('\n'),
    '%PAIR%': (gameDefinition.payouts.partial[2] ?? 0).toString(),
    '%MINBET%': formatAmount(gmeSettings.minBet),
    '%MAXBET%': formatAmount(gmeSettings.maxBet),
};

// Symbol names in the document are swapped for the faces the game is dressed
// in, cut out of the art at runtime.
const names = new RegExp(`\\b(?:${symbols.join('|')})\\b`, 'g');

// The sheet's frames are trimmed and rotated to pack, so the symbol is drawn
// through a sprite to put it back upright inside its square.
const faceUrls: string[] = [];

const face = async (symbol: string) => {
    const sprite = new Sprite(Texture.from(symbol));
    const canvas = app.renderer.extract.canvas(sprite);

    sprite.destroy();

    const blob = canvas.convertToBlob
        ? await canvas.convertToBlob({ type: 'image/png' })
        : canvas.toBlob
          ? await new Promise<Blob | null>((resolve) =>
                canvas.toBlob?.(resolve, 'image/png'),
            )
          : null;

    if (!blob) return symbol;

    const source = URL.createObjectURL(blob);

    faceUrls.push(source);

    return `<img class="symbol" src="${source}" alt="${symbol}">`;
};

// The browser releases object URLs on navigation. HMR does not navigate, so a
// replaced rules module gives back the URLs it created itself.
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        for (const source of faceUrls) URL.revokeObjectURL(source);
    });
}

// Rendered on first open — module load happens before there is a renderer to
// cut symbols from.
let html: Promise<string> | undefined;

const rendered = (source: string) =>
    (html ??= Promise.all(
        symbols.map(async (symbol) => [symbol, await face(symbol)] as const),
    ).then((entries) => {
        const faces = Object.fromEntries(entries);

        return marked.parse(
            source
                .replace(/%\w+%/g, (name) => figures[name] ?? name)
                // After the figures: the paytable is only there once filled in.
                .replace(names, (symbol) => faces[symbol] ?? symbol),
            { async: false },
        );
    }));

function Body() {
    const source = use(copy);

    return (
        // The document ships with the game's own assets; not player-written.
        <div
            className="rules-body"
            dangerouslySetInnerHTML={{ __html: use(rendered(source)) }}
        />
    );
}

class RulesErrorBoundary extends Component<
    { children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        console.error('Unable to render the game rules.', error);
    }

    render() {
        return this.state.failed ? (
            <div className="rules-body" role="alert">
                Unable to load the game rules.
            </div>
        ) : (
            this.props.children
        );
    }
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
            <div className="veil" onPointerDown={onClose} />
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
                <RulesErrorBoundary>
                    <Suspense
                        fallback={
                            <div className="rules-body" role="status">
                                Loading game rules…
                            </div>
                        }
                    >
                        <Body />
                    </Suspense>
                </RulesErrorBoundary>
            </div>
        </>
    );
}
