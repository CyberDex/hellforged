import type { SoundName } from 'config/sound.settings';

export type Tween = {
    stop(): void;
};

export type Tweening = {
    duration: number;
    onUpdate?: (value: number) => void;
    from?: number;
    to?: number;
    ease?: (progress: number) => number;
    onComplete?: () => void;
};

export interface TweenRunner {
    run(options: Tweening): Tween;
}

export interface SoundPlayer {
    play(sound: SoundName): void;
    stop(sound: SoundName): void;
}

export interface GameActions {
    readonly canSpin: boolean;
    spin(): Promise<void>;
    updateBalance(balance: number): void;
}
