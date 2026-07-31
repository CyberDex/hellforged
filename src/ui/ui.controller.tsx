import { createRoot } from 'react-dom/client';
import { FONT_FAMILY } from 'config/font.settings';
import type { RootLayout } from 'layout/Root.layout';
import { TopBar } from 'ui/TopBar';
import 'ui/ui.css';

// The colours are art: filed with the sprites in `assets/theme/theme.json`,
// so a reskin is that one file. Fetched: a DOM-only palette has no business
// on Pixi's manifest (`mIgnore` — see `vite.config.ts`).
const palette = fetch('assets/theme/theme.json').then(
    (response) => response.json() as Promise<Record<string, string>>,
);

// React draws in the DOM over the canvas, never inside the Pixi scene; the
// overlay lets every pointer through to it (see `ui.css`).
export async function mountUI(layout: RootLayout) {
    const root = document.createElement('div');

    root.id = 'ui';
    // Loading the assets registers the font with the document.
    root.style.setProperty('--game-font', FONT_FAMILY);

    // Each entry becomes the custom property `ui.css` reads. Dressed before
    // mounting, so nothing shows in the wrong colours.
    for (const [name, colour] of Object.entries(await palette)) {
        root.style.setProperty(`--${name}`, colour);
    }

    document.body.appendChild(root);

    createRoot(root).render(<TopBar layout={layout} />);
}
