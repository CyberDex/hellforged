# Source assets

Everything here is **source** art. AssetPack (configured in [vite.config.ts](../vite.config.ts))
transforms it into `public/assets` — which is generated, gitignored, and never edited by hand.

Processing is driven by **tags**: `{tag}` appended to a folder or file name. Tags on a folder are
inherited by everything inside it.

## Layout

```
assets/
    backgrounds/          full-screen art — stays as standalone textures
        bg.png
    sprites{tps}/         small sprites — packed into a `sprites` atlas
        spin-button.png
```

## Tags in use

| Tag       | Applies to    | Effect                                                                       |
| --------- | ------------- | ---------------------------------------------------------------------------- |
| `{tps}`   | folder        | Packs every image in the folder (recursively) into one atlas + JSON          |
| `{m}`     | folder        | Emits the folder as its own manifest bundle instead of `default`             |
| `{jpg}`   | `{tps}` folder| Writes the atlas page as JPEG — only valid when no sprite needs transparency  |
| `{fix}`   | file / folder | Single resolution only, no `@0.5x` variant                                   |
| `{nomip}` | file / folder | Same as `{fix}`, but keeps the largest resolution                            |
| `{nc}`    | file / folder | Skips compression, ships the file byte-for-byte                              |
| `{mIgnore}`| file / folder| Processed, but left out of the manifest (load it by URL yourself)            |
| `{wf}`    | folder        | Converts `.ttf`/`.otf`/`.svg` fonts to `.woff2`                              |
| `{font}`  | folder        | Generates an MSDF bitmap font from `.ttf` (for text that scales)             |

Audio (`.mp3`/`.ogg`/`.wav`) needs no tag — it is always transcoded to `.mp3` + `.ogg`.

## Rules of thumb

- **Atlas the small stuff, not the big stuff.** Symbols, buttons, frames, and particles belong in a
  `{tps}` folder. A full-screen background does not: it would force the sheet up to the next
  power-of-two and burn GPU memory on padding. That is why `bg.png` sits in `backgrounds/`.
- **One `{tps}` folder per logical group** (`symbols{tps}/`, `ui{tps}/`, …). Each folder becomes one
  atlas named after the folder, so grouping controls what loads together.
- **Frame names must be globally unique.** `nameStyle` is `short`, so `ui{tps}/spin.png` and
  `symbols{tps}/spin.png` would clash — AssetPack warns at build time when they do.
- **Numbered sequences become animations.** `win-0.png`, `win-1.png`, … inside a `{tps}` folder are
  auto-detected and exposed as `spritesheet.animations['win']`.
- **Opaque art is cheaper as JPEG.** Author backgrounds as `.jpg`; a `.png` source can only be
  re-encoded to `.png`/`.webp`, never to `.jpg`.

## Using the output

Aliases are the source path minus tags and extension, plus a basename shortcut:

```ts
Sprite.from('bg'); // backgrounds/bg.png
Sprite.from('spin-button'); // frame inside the sprites atlas
```
