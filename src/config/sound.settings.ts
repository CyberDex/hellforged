// Which of the player's two volumes a sound answers to: the music bed, or
// everything the game does over it.
export type SoundChannel = 'music' | 'fx';

export type SoundSettings = {
    loop: boolean;
    // How loud the sound sits in the mix, which the slider for its channel
    // then brings down.
    volume: number;
    channel: SoundChannel;
    // The least time, in milliseconds, between one play of the sound and the
    // next being let through. Sounds asked for a figure at a time are asked for
    // far faster than they last, and left alone they pile up into noise; a
    // delay holds the next one off until the last has been heard as its own.
    // Left off by anything played the once, which has nothing to overlap.
    repeatDelay?: number;
};

export const sounds = {
    music: { loop: true, volume: 0.3, channel: 'music' },
    click: { loop: false, volume: 1, channel: 'fx' },
    reelSpin: { loop: true, volume: 1, channel: 'fx' },
    reelStop: { loop: false, volume: 1, channel: 'fx' },
    anticipation: { loop: false, volume: 1, channel: 'fx' },
    win: { loop: false, volume: 1, channel: 'fx' },
    // One coin per figure the win count passes through or the bet is dragged
    // over, which is more figures a second than a coin takes to land. The delay
    // is about a third of the coin itself, so a fast count keeps the rattle of
    // money being counted out without every figure piling onto the last.
    coin: { loop: false, volume: 0.4, channel: 'fx', repeatDelay: 80 },
} satisfies Record<string, SoundSettings>;

export type SoundName = keyof typeof sounds;

// Where the two sliders open on a first session. The mix above is already
// balanced, so the player's own controls only ever take it down from full.
export const defaultVolumes: Record<SoundChannel, number> = {
    music: 1,
    fx: 1,
};
