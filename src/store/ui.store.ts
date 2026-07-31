import { createStore } from 'zustand/vanilla';

export interface UIStore {
    overlayOpen: boolean;
    setOverlayOpen: (overlayOpen: boolean) => void;
}

export const uiStore = createStore<UIStore>()((set) => ({
    overlayOpen: false,
    setOverlayOpen: (overlayOpen) => set({ overlayOpen }),
}));
