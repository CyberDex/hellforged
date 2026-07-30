import { createStore } from 'zustand/vanilla';

export type GameState = 'idle' | 'spin' | 'reveal';

interface GameStore {
    state: GameState;
    setState: (state: GameState) => void;
}

export const gameStore = createStore<GameStore>((set) => ({
    state: 'idle',

    setState: (state) => set({ state }),
}));
