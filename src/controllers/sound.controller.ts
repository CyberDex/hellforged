import { Howl } from 'howler';
import { Assets } from 'pixi.js';
import {
    sounds,
    type SoundName,
    type SoundSettings,
} from 'config/sound.settings';
import { soundStore } from 'store/sound.store';

class SoundController {
    #howls: Map<SoundName, Howl> = new Map();
    #played: Map<SoundName, number> = new Map();
    #unsubscribe: () => void;

    constructor() {
        // Applied to what is already playing too, not only the next sound.
        this.#unsubscribe = soundStore.subscribe(() => this.mix());
    }

    // Inside its repeat delay a sound is dropped, not queued: held back, it
    // would land after the count it belongs to.
    play(sound: SoundName) {
        // Typed as the settings, since not every entry has a repeatDelay key.
        const { repeatDelay }: SoundSettings = sounds[sound];
        const now = performance.now();
        const played = this.#played.get(sound) ?? -Infinity;

        if (repeatDelay && now - played < repeatDelay) return;

        this.#played.set(sound, now);
        this.load(sound)?.play();
    }

    stop(sound: SoundName) {
        this.#howls.get(sound)?.stop();
    }

    // Unloading, not just dropping: Howler holds every Howl in a global
    // registry, so a cleared map alone would keep the audio alive.
    destroy() {
        this.#unsubscribe();

        for (const howl of this.#howls.values()) howl.unload();

        this.#howls.clear();
        this.#played.clear();
    }

    // Muting silences rather than stops, so unmuting resumes in place.
    private mix() {
        const { muted } = soundStore.getState();

        for (const [name, howl] of this.#howls) {
            howl.mute(muted);
            howl.volume(this.volume(name));
        }
    }

    private volume(sound: SoundName) {
        const { channel, volume } = sounds[sound];

        return volume * soundStore.getState().volumes[channel];
    }

    private load(sound: SoundName) {
        let howl = this.#howls.get(sound);

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

            this.#howls.set(sound, howl);
        }

        return howl;
    }
}

export const sound = new SoundController();
