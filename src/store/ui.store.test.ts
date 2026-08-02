import { afterEach, describe, expect, it } from 'vitest';
import { uiStore } from './ui.store';

describe('UI store', () => {
    afterEach(() => uiStore.getState().setOverlayOpen(false));

    it('publishes whether an overlay is open', () => {
        uiStore.getState().setOverlayOpen(true);

        expect(uiStore.getState().overlayOpen).toBe(true);

        uiStore.getState().setOverlayOpen(false);

        expect(uiStore.getState().overlayOpen).toBe(false);
    });
});
