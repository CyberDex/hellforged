import { createRoot } from 'react-dom/client';
import { FONT_FAMILY } from 'config/font.settings';
import { TopBar } from 'ui/TopBar';
import 'ui/ui.css';

// The colours are art: filed with the sprites in `assets/theme/theme.json`,
// so a reskin is that one file. Fetched: a DOM-only palette has no business
// on Pixi's manifest (`mIgnore` — see `vite.config.ts`).
const palette = fetch('assets/theme/theme.json').then(async (response) => {
    if (!response.ok) {
        throw new Error(`Unable to load UI theme (${response.status}).`);
    }

    return response.json() as Promise<Record<string, string>>;
});

// React draws in the DOM over the canvas, never inside the Pixi scene, and
// knows nothing of it: the overlay takes its measures from `ui.css` alone,
// and lets every pointer through to the game (see `ui.css`).
export async function mountUI() {
    const root = document.createElement('div');

    root.id = 'ui';
    // Loading the assets registers the font with the document.
    root.style.setProperty('--game-font', FONT_FAMILY);

    document.body.appendChild(root);

    const reactRoot = createRoot(root);

    try {
        // Each entry becomes the custom property `ui.css` reads. Dressed before
        // mounting, so nothing shows in the wrong colours.
        for (const [name, colour] of Object.entries(await palette)) {
            root.style.setProperty(`--${name}`, colour);
        }

        reactRoot.render(<TopBar />);
    } catch (error) {
        console.error('Unable to mount the UI.', error);
        reactRoot.render(
            <div className="ui-error" role="alert">
                Unable to load the interface. Reload the page to try again.
            </div>,
        );
    }
}
