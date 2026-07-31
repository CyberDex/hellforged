import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { gmeSettings } from 'config/game.settings';
import { gameName } from 'config/game.name';
import type { StateCreator } from 'zustand/vanilla';

export type GameState = 'idle' | 'spin' | 'reveal';

export interface PendingSpin {
    bet: number;
    result: { symbols: string[][]; win: number } | null;
}

export interface GameStore {
    state: GameState;
    balance: number;
    bet: number;
    win: number;
    symbols: string[][] | null;
    pending: PendingSpin | null;
    setState: (state: GameState) => void;
    setBalance: (balance: number) => void;
    setBet: (bet: number) => void;
    startSpin: (bet: number) => void;
    setSpinResult: (symbols: string[][], win: number) => void;
    settleSpin: () => void;
}

export const gameState: StateCreator<GameStore> = (set, get) => ({
    state: 'idle',
    balance: gmeSettings.defaultBalance,
    bet: gmeSettings.defaultBet,
    win: 0,
    symbols: null,
    pending: null,

    setState: (state) => set({ state }),
    setBalance: (balance) => set({ balance }),
    setBet: (bet) => set({ bet }),
    startSpin: (bet) =>
        set(({ balance }) => ({
            balance: balance - bet,
            win: 0,
            symbols: null,
            pending: { bet, result: null },
        })),
    setSpinResult: (symbols, win) =>
        set(({ pending }) => ({
            pending: pending ? { ...pending, result: { symbols, win } } : null,
        })),
    settleSpin: () => {
        const { balance, pending } = get();

        if (!pending) return;

        const { result } = pending;

        set({
            balance: balance + (result?.win ?? pending.bet),
            win: result?.win ?? 0,
            symbols: result?.symbols ?? null,
            pending: null,
        });
    },
});

export const createGameStore = () =>
    createStore<GameStore>()(
        persist(gameState, {
            name: `${gameName}.player`,
            partialize: ({ balance, bet, win, symbols, pending }) => ({
                balance,
                bet,
                win,
                symbols,
                pending,
            }),
        }),
    );
