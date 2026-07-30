// The game is named once, by `name` in package.json, and Vite defines the two
// constants below into the bundle (see `define` in vite.config.ts). Anything
// that spells the game out — a storage key, a title — reads it from here rather
// than writing it out, so dressing this app up as another slot is one rename.

/** The slug the game is filed under: `hellforged`. Namespaces storage keys. */
export const gameName = __GAME_NAME__;

/** The same name spelled out for the player: `Hellforged`. */
export const gameTitle = __GAME_TITLE__;
