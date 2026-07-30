import { createStore } from 'zustand/vanilla';
import { settings } from 'config/game.settings';

export type GameState = 'idle' | 'spin' | 'reveal';

interface GameStore {
    state: GameState;
    balance: number;
    bet: number;
    win: number;
    setState: (state: GameState) => void;
    setBalance: (balance: number) => void;
    setWin: (win: number) => void;
}

export const gameStore = createStore<GameStore>((set) => ({
    state: 'idle',
    balance: settings.defaultBalance,
    bet: settings.defaultBet,
    win: 0,

    setState: (state) => set({ state }),
    setBalance: (balance) => set({ balance }),
    setWin: (win) => set({ win }),
}));
