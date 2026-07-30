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
    // What the reels are showing, column by column, or nothing while they are
    // on symbols no spin has landed them on.
    symbols: string[][] | null;
    setState: (state: GameState) => void;
    setBalance: (balance: number) => void;
    setBet: (bet: number) => void;
    // The result of a spin is the symbols and the win together: the one is what
    // the other was paid for, so neither is written without the other and what
    // comes back from storage always adds up.
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
            // The last result is kept along with the money, so the game opens
            // on the spin the player left rather than on a fresh set of
            // symbols. The state is not: a spin cut off by a reload is over.
            partialize: ({ balance, bet, win, symbols }) => ({
                balance,
                bet,
                win,
                symbols,
            }),
        },
    ),
);
