import { Howl } from 'howler';
import { Assets } from 'pixi.js';
import { sounds, type SoundName } from 'config/sound.settings';

class SoundController {
    private howls: Map<SoundName, Howl> = new Map();

    play(sound: SoundName) {
        this.load(sound)?.play();
    }

    stop(sound: SoundName) {
        this.howls.get(sound)?.stop();
    }

    private load(sound: SoundName) {
        let howl = this.howls.get(sound);

        if (!howl) {
            const { src } = Assets.resolver.resolve(sound);

            if (!Assets.resolver.hasKey(sound) || !src) {
                console.warn(`Sound "${sound}" not found.`);

                return undefined;
            }

            const { loop, volume } = sounds[sound];

            howl = new Howl({ src: [src], loop, volume });

            this.howls.set(sound, howl);
        }

        return howl;
    }
}

export const sound = new SoundController();
