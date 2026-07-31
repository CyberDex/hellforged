import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { gameName } from 'config/game.name';

export interface GraphicsStore {
    shader: boolean;
    setShader: (shader: boolean) => void;
}

// Kept between sessions: a machine the shader was too much for stays off
// until the player says otherwise.
export const createGraphicsStore = () =>
    createStore<GraphicsStore>()(
        persist(
            (set) => ({
                shader: true,

                setShader: (shader) => set({ shader }),
            }),
            { name: `${gameName}.graphics` },
        ),
    );
