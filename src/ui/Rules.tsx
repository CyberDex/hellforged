import { marked } from 'marked';
import { settings } from 'config/game.settings';
import rules from 'config/rules.player.md?raw';
import { Dialog } from 'ui/Dialog';

// The rules as the player is told them, out of `config/rules.player.md`.
// `config/rules.md` beside it is the same game written out for whoever works on
// it, down to the file and the setting each rule lives in, which is not what
// somebody who only wants to know what a symbol pays came to read.
//
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
        '| Symbol | Three of a kind |',
        '| ------ | --------------- |',
        ...Object.entries(settings.payouts.three).map(
            ([symbol, payout]) => `| ${symbol} | ${payout} x bet |`,
        ),
    ].join('\n'),
    '%PAIR%': settings.payouts.two.toString(),
    '%MINBET%': settings.minBet.toLocaleString(),
    '%MAXBET%': settings.maxBet.toLocaleString(),
};

// Rendered once, as the module is loaded, rather than on every opening of a
// document that cannot change while the game is running.
const html = marked.parse(
    rules.replace(/%\w+%/g, (name) => figures[name] ?? name),
    { async: false },
);

export function Rules({ onClose }: { onClose: () => void }) {
    return (
        // The one sheet not cut to the reels, and the one never given a height
        // to fill: this is the pop up with more on it than fits, so it is handed
        // no measurement of the machine at all and takes the whole screen
        // instead, scrolling what it cannot show (see `.rules` in `ui.css`).
        <Dialog className="rules" title="Game rules" onClose={onClose}>
            {/* The document ships in the bundle as one of the game's own
                files, so there is nothing on this sheet the player had any hand
                in writing. */}
            <div
                className="rules-body"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </Dialog>
    );
}
