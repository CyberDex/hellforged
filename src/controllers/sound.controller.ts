import { Howl } from 'howler';
import { Assets } from 'pixi.js';
import {
    sounds,
    type SoundName,
    type SoundSettings,
} from 'config/sound.settings';
import { soundStore } from 'store/sound.store';

class SoundController {
    private howls: Map<SoundName, Howl> = new Map();
    // When each sound was last let through, against which the repeat delay it
    // asks for in the mix is measured.
    private played: Map<SoundName, number> = new Map();

    constructor() {
        // The player's mix is applied to a sound as it is made and to every
        // sound already made whenever they move it, so a slider is heard on
        // what is playing at the time rather than only on the next spin.
        soundStore.subscribe(() => this.mix());
    }

    // A sound asked for again inside its repeat delay is dropped rather than
    // queued: what is being counted out is the figures going past, and a coin
    // held back for later would land after the count it belongs to has moved on.
    play(sound: SoundName) {
        // Read as the settings rather than as the one entry, which without a
        // delay of its own has no such key to read off it.
        const { repeatDelay }: SoundSettings = sounds[sound];
        const now = performance.now();
        const played = this.played.get(sound) ?? -Infinity;

        if (repeatDelay && now - played < repeatDelay) return;

        this.played.set(sound, now);
        this.load(sound)?.play();
    }

    stop(sound: SoundName) {
        this.howls.get(sound)?.stop();
    }

    // Muting silences the game rather than stopping it: the music keeps its
    // place and a running spin keeps its loop, so unmuting comes back to where
    // the game got to rather than starting anything again.
    private mix() {
        const { muted } = soundStore.getState();

        for (const [name, howl] of this.howls) {
            howl.mute(muted);
            howl.volume(this.volume(name));
        }
    }

    // What a sound actually plays at: its own level in the mix, brought down by
    // the volume set for the channel it belongs to.
    private volume(sound: SoundName) {
        const { channel, volume } = sounds[sound];

        return volume * soundStore.getState().volumes[channel];
    }

    private load(sound: SoundName) {
        let howl = this.howls.get(sound);

        if (!howl) {
            const { src } = Assets.resolver.resolve(sound);

            if (!Assets.resolver.hasKey(sound) || !src) {
                console.warn(`Sound "${sound}" not found.`);

                return undefined;
            }

            const { loop } = sounds[sound];
            const { muted } = soundStore.getState();

            howl = new Howl({
                src: [src],
                loop,
                volume: this.volume(sound),
                mute: muted,
            });

            this.howls.set(sound, howl);
        }

        return howl;
    }
}

export const sound = new SoundController();
