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
    // One coin per figure the win count passes through, so several land on top
    // of each other every second and each is quieter than a one-off would be.
    coin: { loop: false, volume: 0.4 },
} satisfies Record<string, SoundSettings>;

export type SoundName = keyof typeof sounds;
