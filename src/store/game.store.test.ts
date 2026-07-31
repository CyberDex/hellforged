import { createStore } from 'zustand/vanilla';
import { describe, expect, it, vi } from 'vitest';
import { gmeSettings } from 'config/game.settings';
import { gameState } from './game.store';
import type { GameStore } from './game.store';

const createTestStore = () => createStore<GameStore>()(gameState);

describe('game spin transactions', () => {
    it('refunds an unresolved spin once', () => {
        const store = createTestStore();
        const { startSpin, settleSpin } = store.getState();

        startSpin(100);

        expect(store.getState()).toMatchObject({
            balance: gmeSettings.defaultBalance - 100,
            symbols: null,
            win: 0,
            pending: { bet: 100, result: null },
        });

        settleSpin();
        settleSpin();

        expect(store.getState()).toMatchObject({
            balance: gmeSettings.defaultBalance,
            symbols: null,
            win: 0,
            pending: null,
        });
    });

    it('credits and restores a received result once', () => {
        const store = createTestStore();
        const symbols = [['H1'], ['H1'], ['H1']];
        const { startSpin, setSpinResult, settleSpin } = store.getState();

        startSpin(100);
        setSpinResult(symbols, 300);
        settleSpin();
        settleSpin();

        expect(store.getState()).toMatchObject({
            balance: gmeSettings.defaultBalance + 200,
            symbols,
            win: 300,
            pending: null,
        });
    });

    it('applies a received win to a balance updated during the spin', () => {
        const store = createTestStore();
        const { startSpin, setSpinResult, settleSpin, setBalance } =
            store.getState();

        startSpin(100);
        setBalance(500);
        setSpinResult([['H2'], ['H2'], ['H2']], 50);
        settleSpin();

        expect(store.getState().balance).toBe(550);
    });

    it('refunds an unresolved stake onto a balance updated during the spin', () => {
        const store = createTestStore();
        const { startSpin, settleSpin, setBalance } = store.getState();

        startSpin(100);
        setBalance(500);
        settleSpin();

        expect(store.getState().balance).toBe(600);
    });

    it('does not update the store when there is no pending spin', () => {
        const store = createTestStore();
        const listener = vi.fn();

        store.subscribe(listener);
        store.getState().settleSpin();

        expect(listener).not.toHaveBeenCalled();
    });
});
