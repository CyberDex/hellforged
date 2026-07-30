import { createRoot } from 'react-dom/client';
import { FONT_FAMILY } from 'config/font.settings';
import type { RootLayout } from 'layout/Root.layout';
import { TopBar } from 'ui/TopBar';
import 'ui/ui.css';

// The colours are art rather than code: they are filed with the sprites the UI
// is dressed to match, in `assets/theme{copy}{mIgnore}/theme.json`, so
// reskinning the game is that one file and no rebuild of anything here.
//
// Fetched rather than loaded with the art it is filed beside: the manifest is
// Pixi's list of what to put on the reels, and a palette only the DOM ever reads
// has no business on it (`mIgnore` keeps it off — see `vite.config.ts`). The
// request goes out as this module is loaded, which the page reaches long before
// the renderer is up, so the overlay is never held up waiting on it.
const palette = fetch('assets/theme/theme.json').then(
    (response) => response.json() as Promise<Record<string, string>>,
);

// React draws in the DOM, over the canvas, and never inside the Pixi scene:
// the two own separate trees, so neither can be caught rewriting the other's.
// The overlay it renders on covers the whole page and lets every pointer
// through to the canvas underneath, so the game keeps all of the input it had
// (see `ui.css`).
export async function mountUI(layout: RootLayout) {
    const root = document.createElement('div');

    root.id = 'ui';
    // The game font is loaded with the assets, which registers it with the
    // document, so the DOM asks for it by the one name the game knows it by.
    root.style.setProperty('--game-font', FONT_FAMILY);

    // Every entry in the palette is written out as the custom property of that
    // name, which is how `ui.css` reads them. Dressed before it is mounted, so
    // nothing is ever on screen in colours it is not meant to be wearing.
    for (const [name, colour] of Object.entries(await palette)) {
        root.style.setProperty(`--${name}`, colour);
    }

    document.body.appendChild(root);

    createRoot(root).render(<TopBar layout={layout} />);
}
