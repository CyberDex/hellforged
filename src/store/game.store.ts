import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { settings } from 'config/game.settings';
import { gameName } from 'config/game.name';

export type GameState = 'idle' | 'spin' | 'reveal';

interface GameStore {
    state: GameState;
    balance: number;
    bet: number;
    win: number;
    setState: (state: GameState) => void;
    setBalance: (balance: number) => void;
    setBet: (bet: number) => void;
    setWin: (win: number) => void;
}

export const gameStore = createStore<GameStore>()(
    persist(
        (set) => ({
            state: 'idle',
            balance: settings.defaultBalance,
            bet: settings.defaultBet,
            win: 0,

            setState: (state) => set({ state }),
            setBalance: (balance) => set({ balance }),
            setBet: (bet) => set({ bet }),
            setWin: (win) => set({ win }),
        }),
        {
            name: `${gameName}.player`,
            // Only the money is kept: the game state and the win belong to the
            // spin that was running, and a reload has no spin, so a session
            // always opens idle with nothing on the win pannel.
            partialize: ({ balance, bet }) => ({ balance, bet }),
        },
    ),
);
