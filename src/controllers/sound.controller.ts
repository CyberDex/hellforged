import { Howl } from 'howler';
import { Assets } from 'pixi.js';

class SoundController {
    private sounds: Map<string, Howl> = new Map();

    play(sound: string, loop: boolean = false) {
        const howl = this.load(sound);

        howl?.loop(loop);
        howl?.play();
    }

    stop(sound: string) {
        this.sounds.get(sound)?.stop();
    }

    private load(sound: string) {
        let howl = this.sounds.get(sound);

        if (!howl) {
            const { src } = Assets.resolver.resolve(sound);

            if (!Assets.resolver.hasKey(sound) || !src) {
                console.warn(`Sound "${sound}" not found.`);

                return undefined;
            }

            howl = new Howl({ src: [src], volume: 0.5 });

            this.sounds.set(sound, howl);
        }

        return howl;
    }
}

export const sound = new SoundController();
