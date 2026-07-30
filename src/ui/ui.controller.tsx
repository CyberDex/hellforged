import { createRoot } from 'react-dom/client';
import { Assets } from 'pixi.js';
import { FONT_FAMILY } from 'config/font.settings';
import type { RootLayout } from 'layout/Root.layout';
import { TopBar } from 'ui/TopBar';
import 'ui/ui.css';

// React draws in the DOM, over the canvas, and never inside the Pixi scene:
// the two own separate trees, so neither can be caught rewriting the other's.
// The overlay it renders on covers the whole page and lets every pointer
// through to the canvas underneath, so the game keeps all of the input it had
// (see `ui.css`).
export function mountUI(layout: RootLayout) {
    const root = document.createElement('div');

    root.id = 'ui';
    // The game font is loaded with the assets, which registers it with the
    // document, so the DOM asks for it by the one name the game knows it by.
    root.style.setProperty('--game-font', FONT_FAMILY);

    // The colours are art rather than code: they are filed with the sprites the
    // UI is dressed to match, in `assets/theme{copy}/theme.json`, and come in
    // with the same bundle. Every entry is written out as the custom property
    // of that name, which is how `ui.css` reads them, so reskinning the game is
    // the one file and no rebuild of anything here.
    const theme = Assets.get<Record<string, string>>('theme');

    for (const [name, colour] of Object.entries(theme)) {
        root.style.setProperty(`--${name}`, colour);
    }

    document.body.appendChild(root);

    createRoot(root).render(<TopBar layout={layout} />);
}
