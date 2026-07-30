// Which of the player's two volumes a sound answers to: the music bed, or
// everything the game does over it.
export type SoundChannel = 'music' | 'fx';

type SoundSettings = {
    loop: boolean;
    // How loud the sound sits in the mix, which the slider for its channel
    // then brings down.
    volume: number;
    channel: SoundChannel;
};

export const sounds = {
    music: { loop: true, volume: 0.3, channel: 'music' },
    click: { loop: false, volume: 1, channel: 'fx' },
    reelSpin: { loop: true, volume: 1, channel: 'fx' },
    reelStop: { loop: false, volume: 1, channel: 'fx' },
    anticipation: { loop: false, volume: 1, channel: 'fx' },
    win: { loop: false, volume: 1, channel: 'fx' },
    // One coin per figure the win count passes through, so several land on top
    // of each other every second and each is quieter than a one-off would be.
    coin: { loop: false, volume: 0.4, channel: 'fx' },
} satisfies Record<string, SoundSettings>;

export type SoundName = keyof typeof sounds;

// Where the two sliders open on a first session. The mix above is already
// balanced, so the player's own controls only ever take it down from full.
export const defaultVolumes: Record<SoundChannel, number> = {
    music: 1,
    fx: 1,
};
