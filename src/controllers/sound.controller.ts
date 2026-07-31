import { Howl } from 'howler';
import { Assets } from 'pixi.js';
import {
    soundSettings,
    type SoundName,
    type SoundSettings,
} from 'config/sound.settings';
import type { StoreApi } from 'zustand/vanilla';
import type { SoundStore } from 'store/sound.store';

export class SoundController {
    readonly #howls: Map<SoundName, Howl> = new Map();
    readonly #played: Map<SoundName, number> = new Map();
    readonly #store: StoreApi<SoundStore>;
    #unsubscribe?: () => void;

    constructor(store: StoreApi<SoundStore>) {
        this.#store = store;
    }

    init() {
        if (this.#unsubscribe) return;

        // Applied to what is already playing too, not only the next sound.
        this.#unsubscribe = this.#store.subscribe(() => this.mix());
    }

    play(sound: SoundName) {
        // Typed as the settings, since not every entry has a repeatDelay key.
        const { repeatDelay }: SoundSettings = soundSettings[sound];
        const now = performance.now();
        const played = this.#played.get(sound) ?? -Infinity;

        if (repeatDelay && now - played < repeatDelay) return;

        this.#played.set(sound, now);
        this.load(sound)?.play();
    }

    stop(sound: SoundName) {
        this.#howls.get(sound)?.stop();
    }

    destroy() {
        this.#unsubscribe?.();
        this.#unsubscribe = undefined;

        for (const howl of this.#howls.values()) howl.unload();

        this.#howls.clear();
        this.#played.clear();
    }

    // Muting silences rather than stops, so unmuting resumes in place.
    private mix() {
        const { muted } = this.#store.getState();

        for (const [name, howl] of this.#howls) {
            howl.mute(muted);
            howl.volume(this.volume(name));
        }
    }

    private volume(sound: SoundName) {
        const { channel, volume } = soundSettings[sound];

        return volume * this.#store.getState().volumes[channel];
    }

    private load(sound: SoundName) {
        let howl = this.#howls.get(sound);

        if (!howl) {
            const { src } = Assets.resolver.resolve(sound);

            if (!Assets.resolver.hasKey(sound) || !src) {
                console.warn(`Sound "${sound}" not found.`);

                return undefined;
            }

            const { loop } = soundSettings[sound];
            const { muted } = this.#store.getState();

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
