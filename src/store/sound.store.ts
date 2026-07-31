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

// Kept between sessions: a game turned down opens turned down.
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
        {
            name: `${gameName}.sound`,
            merge: (persisted, current) => {
                const stored = persisted as Partial<SoundStore>;

                return {
                    ...current,
                    ...stored,
                    volumes: { ...current.volumes, ...stored.volumes },
                };
            },
        },
    ),
);
