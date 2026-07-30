import { settings } from 'config/game.settings';

export function getRandomSymbol(): string {
    return settings.symbols[
        Math.floor(Math.random() * settings.symbols.length)
    ];
}
