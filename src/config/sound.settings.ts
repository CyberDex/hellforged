type SoundSettings = {
    loop: boolean;
    volume: number;
};

export const sounds = {
    music: { loop: true, volume: 0.3 },
    click: { loop: false, volume: 1 },
    reelSpin: { loop: true, volume: 1 },
    reelStop: { loop: false, volume: 1 },
    anticipation: { loop: false, volume: 1 },
    win: { loop: false, volume: 1 },
} satisfies Record<string, SoundSettings>;

export type SoundName = keyof typeof sounds;
