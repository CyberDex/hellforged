import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gmeSettings } from 'config/game.settings';
import { gameStore } from 'store/game.store';
import { GameController } from './game.controller';
import type { RootLayout } from 'layout/Root.layout';

const sound = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn() }));

vi.mock('./api.controller', () => ({ API: { spin: vi.fn() } }));
vi.mock('./sound.controller', () => ({ sound }));
vi.mock('./tween.controller', () => ({
    tween: { run: vi.fn(() => ({ stop: vi.fn() })) },
}));

class Signal<T extends unknown[]> {
    readonly #listeners: Array<(...values: T) => void> = [];

    connect(listener: (...values: T) => void) {
        this.#listeners.push(listener);
    }

    emit(...values: T) {
        for (const listener of this.#listeners) listener(...values);
    }
}

function createLayout() {
    const onPress = new Signal<[]>();
    const onUpdate = new Signal<[number]>();
    let sliderValue = gmeSettings.defaultBet;
    const sliderWrites: Array<{ value: number; storeBet: number }> = [];
    const betPannel = {
        reading: 0,
        cleared: false,
        set value(value: number) {
            this.reading = value;
            this.cleared = false;
        },
        clear() {
            this.cleared = true;
        },
    };
    const winPannel = {
        reading: 0,
        set value(value: number) {
            this.reading = value;
        },
    };
    const betSlider = {
        enabled: false,
        max: gmeSettings.maxBet,
        onUpdate,
        get value() {
            return sliderValue;
        },
        set value(value: number) {
            if (value === sliderValue) return;

            sliderValue = value;
            sliderWrites.push({ value, storeBet: gameStore.getState().bet });
            onUpdate.emit(value);
        },
    };
    const winLayout = {
        hide: vi.fn(),
        on: vi.fn(),
        outOfFunds: vi.fn(),
        show: vi.fn(),
    };
    const reels = {
        highlight: vi.fn(),
        on: vi.fn(),
        set symbols(_symbols: string[][]) {},
    };
    const spinButton = { enabled: false, onPress };
    const layout = {
        betPannel,
        betSlider,
        reels,
        spinButton,
        winLayout,
        winPannel,
        unzoom: vi.fn(() => false),
    } as unknown as RootLayout;

    return {
        layout,
        betPannel,
        betSlider,
        sliderWrites,
        spinButton,
        winLayout,
        winPannel,
    };
}

let controller: GameController;

beforeEach(() => {
    gameStore.setState({
        state: 'idle',
        balance: 100,
        bet: 100,
        win: 25,
        symbols: null,
        pending: null,
    });

    controller = new GameController();
});

afterEach(() => {
    controller.destroy();
    sound.play.mockClear();
    sound.stop.mockClear();
});

describe('GameController controls', () => {
    it('stores a capped bet before mirroring it to the slider', () => {
        const controls = createLayout();

        controller.init(controls.layout);
        controls.sliderWrites.length = 0;

        controller.updateBalance(50);

        expect(gameStore.getState().bet).toBe(50);
        expect(controls.betSlider.max).toBe(50);
        expect(controls.betSlider.value).toBe(50);
        expect(controls.sliderWrites).toEqual([{ value: 50, storeBet: 50 }]);
    });

    it('renders the controls from the current store state', () => {
        const controls = createLayout();

        controller.init(controls.layout);

        expect(controls.spinButton.enabled).toBe(true);
        expect(controls.betSlider.enabled).toBe(true);
        expect(controls.betPannel.reading).toBe(100);
        expect(controls.winPannel.reading).toBe(25);

        controller.updateBalance(0);

        expect(controls.spinButton.enabled).toBe(false);
        expect(controls.betSlider.enabled).toBe(false);
        expect(controls.betPannel.cleared).toBe(true);
        expect(controls.winLayout.outOfFunds).toHaveBeenCalled();
    });
});
