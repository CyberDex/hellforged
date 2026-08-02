import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Application } from 'pixi.js';
import type { StoreApi } from 'zustand/vanilla';
import type {
    GameActions,
    SoundPlayer,
    TweenRunner,
} from 'controllers/contracts';
import type { GameStore } from 'store/game.store';
import type { GraphicsStore } from 'store/graphics.store';
import type { SoundStore } from 'store/sound.store';

export interface UIRuntime {
    app: Application;
    game: GameActions;
    gameStore: StoreApi<GameStore>;
    graphicsStore: StoreApi<GraphicsStore>;
    sound: SoundPlayer;
    soundStore: StoreApi<SoundStore>;
    tween: TweenRunner;
}

const RuntimeContext = createContext<UIRuntime | null>(null);

export function RuntimeProvider({
    children,
    runtime,
}: {
    children: ReactNode;
    runtime: UIRuntime;
}) {
    return <RuntimeContext value={runtime}>{children}</RuntimeContext>;
}

export function useRuntime() {
    const runtime = useContext(RuntimeContext);

    if (!runtime) throw new Error('UI runtime is not available.');

    return runtime;
}
