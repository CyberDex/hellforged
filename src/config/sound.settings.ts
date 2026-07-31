export type SoundChannel = 'music' | 'fx';

export type SoundSettings = {
    loop: boolean;
    volume: number;
    channel: SoundChannel;
    // The least time, in milliseconds, between one play and the next being
    // let through: sounds asked for a figure at a time would otherwise pile
    // up into noise. Left off by anything played the once.
    repeatDelay?: number;
};

export const sounds = {
    music: { loop: true, volume: 0.3, channel: 'music' },
    click: { loop: false, volume: 1, channel: 'fx' },
    reelSpin: { loop: true, volume: 1, channel: 'fx' },
    reelStop: { loop: false, volume: 1, channel: 'fx' },
    anticipation: { loop: false, volume: 1, channel: 'fx' },
    win: { loop: false, volume: 1, channel: 'fx' },
    // About a third of the coin sound itself, so a fast count keeps the
    // rattle without every figure piling onto the last.
    coin: { loop: false, volume: 0.4, channel: 'fx', repeatDelay: 80 },
} satisfies Record<string, SoundSettings>;

export type SoundName = keyof typeof sounds;

export const defaultVolumes: Record<SoundChannel, number> = {
    music: 1,
    fx: 1,
};
