import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { gameName } from 'config/game.name';

interface GraphicsStore {
    shader: boolean;
    setShader: (shader: boolean) => void;
}

// What the player has done to how the game is drawn rather than to how it plays.
// Kept between sessions like the sound is: a machine the shader was too much for
// is a machine it is too much for the next time the game is opened on it, so it
// stays off until the player says otherwise.
export const graphicsStore = createStore<GraphicsStore>()(
    persist(
        (set) => ({
            shader: true,

            setShader: (shader) => set({ shader }),
        }),
        { name: `${gameName}.graphics` },
    ),
);
