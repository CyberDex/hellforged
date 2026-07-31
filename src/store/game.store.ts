import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { settings } from 'config/game.settings';
import { gameName } from 'config/game.name';

export type GameState = 'idle' | 'spin' | 'reveal';

export interface GameStore {
    state: GameState;
    balance: number;
    bet: number;
    win: number;
    symbols: string[][] | null;
    setState: (state: GameState) => void;
    setBalance: (balance: number) => void;
    setBet: (bet: number) => void;
    // The symbols and the win are written together, so what comes back from
    // storage always adds up.
    setResult: (symbols: string[][] | null, win: number) => void;
}

export const gameStore = createStore<GameStore>()(
    persist(
        (set) => ({
            state: 'idle',
            balance: settings.defaultBalance,
            bet: settings.defaultBet,
            win: 0,
            symbols: null,

            setState: (state) => set({ state }),
            setBalance: (balance) => set({ balance }),
            setBet: (bet) => set({ bet }),
            setResult: (symbols, win) => set({ symbols, win }),
        }),
        {
            name: `${gameName}.player`,
            partialize: ({ balance, bet, win, symbols }) => ({
                balance,
                bet,
                win,
                symbols,
            }),
        },
    ),
);
