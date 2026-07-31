import { Suspense, use } from 'react';
import { marked } from 'marked';
import { Sprite, Texture } from 'pixi.js';
import { settings } from 'config/game.settings';
import { app } from 'controllers/app.controller';
import { formatAmount } from 'utils/formatAmount';

// The rules as the player is told them: their own document, filed with the art
// the game is dressed in, at `assets/rules{copy}{mIgnore}/rules.md` — so a
// reskin brings its own rules along with its own sprites and nothing here is
// rebuilt for them. `src/config/rules.md` is the same game written out for
// whoever works on it, down to the file and the setting each rule lives in,
// which is not what somebody who only wants to know what a symbol pays came to
// read.
//
// Fetched here rather than loaded with the art it is filed beside: the manifest
// is Pixi's list of what to put on the reels, and a document only the DOM ever
// reads has no business on it (`mIgnore` keeps it off — see `vite.config.ts`).
// The request goes out as this module is loaded, so the sheet has its text well
// before there is a bar to open it from.
const copy = fetch('assets/rules/rules.md').then((response) => response.text());

// The figures are the one thing that document does not spell out for itself:
// they are filled in from the settings the game is actually played on, so a
// paytable can never quietly come to say something the reels do not do.
//
// The paytable is written out here whole, header and all, rather than as rows
// dropped into a table in the document: Prettier formats that document like any
// other markdown, and a placeholder standing where a table's rows go is folded
// into a cell of its own the first time it is run.
const figures: Record<string, string> = {
    '%PAYTABLE%': [
        // Named for the reels the game is actually played on rather than for
        // the three it ships with, so the column cannot come to head figures
        // that take a fourth reel to land.
        `| Symbol | ${settings.reels} of a kind |`,
        '| ------ | --------------- |',
        ...Object.entries(settings.payouts.full).map(
            ([symbol, payout]) => `| ${symbol} | ${payout} x bet |`,
        ),
    ].join('\n'),
    '%PAIR%': (settings.payouts.partial[2] ?? 0).toString(),
    '%MINBET%': formatAmount(settings.minBet),
    '%MAXBET%': formatAmount(settings.maxBet),
};

// A symbol is a picture on the reels and only a name in the document: `H1` says
// nothing to somebody who came to read what it pays. So the document names the
// symbol, in the same `H1` the settings and the reels know it by, and the sheet
// puts the face the game is dressed in there instead — cut out of the art at
// runtime, so a reskin's paytable is filled with its own symbols and neither
// this file nor the document is touched for it.
const names = new RegExp(`\\b(?:${settings.symbols.join('|')})\\b`, 'g');

// The sprites are packed into one sheet, trimmed and turned on their side to
// fit, so a symbol cannot be lifted straight out of it by its frame: it is
// drawn through a sprite instead, which puts it back the way up it is played
// and back inside the square all five are cut from, so the faces come out one
// size down the paytable however tightly each one is cropped.
const face = (symbol: string) => {
    const source = app.renderer.extract
        .canvas(new Sprite(Texture.from(symbol)))
        .toDataURL?.();

    return source
        ? `<img class="symbol" src="${source}" alt="${symbol}">`
        : symbol;
};

// Rendered the first time the sheet is opened and then held: the document cannot
// change while the game is running. Not as this module is loaded, which the page
// reaches before there is a renderer to cut the symbols out of.
let html: string | undefined;

const rendered = (source: string) =>
    (html ??= marked.parse(
        source
            .replace(/%\w+%/g, (name) => figures[name] ?? name)
            // After the figures rather than before them: the paytable is a
            // column of symbol names, and it is only in the document once the
            // placeholder standing for it has been filled in.
            .replace(names, face),
        { async: false },
    ));

// Split out so that only the text waits on the request: `use` hands the sheet
// back to React until the document lands, and the frame around it is drawn from
// the first render either way.
function Body() {
    return (
        // The document ships with the game's own assets, so there is nothing on
        // this sheet the player had any hand in writing.
        <div
            className="rules-body"
            dangerouslySetInnerHTML={{ __html: rendered(use(copy)) }}
        />
    );
}

// Let down inside the menu rather than opened over the game, so the rules are
// read off the same drawer they are asked for from (see `Menu.tsx`). It is the
// one thing on that drawer with more on it than there is room for, so it scrolls
// what it cannot show (see `.rules-body` in `ui.css`).
export function Rules() {
    return (
        <Suspense fallback={<div className="rules-body" />}>
            <Body />
        </Suspense>
    );
}
