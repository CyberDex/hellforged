import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { gameName } from 'config/game.name';
import { defaultVolumes, type SoundChannel } from 'config/sound.settings';

interface SoundStore {
    muted: boolean;
    volumes: Record<SoundChannel, number>;
    setMuted: (muted: boolean) => void;
    setVolume: (channel: SoundChannel, volume: number) => void;
}

// What the player has done to the sound, which everything is played through
// (see `sound.controller.ts`). Kept between sessions like the money is: a game
// turned down opens turned down rather than blaring again.
export const soundStore = createStore<SoundStore>()(
    persist(
        (set) => ({
            muted: false,
            volumes: defaultVolumes,

            setMuted: (muted) => set({ muted }),
            setVolume: (channel, volume) =>
                set(({ volumes }) => ({
                    volumes: { ...volumes, [channel]: volume },
                })),
        }),
        { name: `${gameName}.sound` },
    ),
);
