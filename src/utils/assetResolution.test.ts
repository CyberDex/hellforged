import { Assets, Resolver } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { getAssetResolutions, getRenderResolution } from './assetResolution';

describe('getRenderResolution', () => {
    it('passes low ratios through', () => {
        expect(getRenderResolution(1)).toBe(1);
        expect(getRenderResolution(1.5)).toBe(1.5);
    });

    it('caps at 2, the biggest shipped texture tier', () => {
        expect(getRenderResolution(3)).toBe(2);
    });
});

describe('getAssetResolutions', () => {
    it('prefers full art on a DPR-1 desktop', () => {
        expect(getAssetResolutions(1920, 1080, 1)).toEqual([1, 0.5]);
    });

    it('prefers half art on a small DPR-1 phone', () => {
        expect(getAssetResolutions(360, 640, 1)).toEqual([0.5, 1]);
    });

    it('prefers full art on a high-DPR phone despite the cap', () => {
        expect(getAssetResolutions(390, 844, 3)).toEqual([1, 0.5]);
    });

    it('keeps half art up to the physical-size threshold', () => {
        expect(getAssetResolutions(400, 800, 1)).toEqual([0.5, 1]);
        expect(getAssetResolutions(400, 801, 1)).toEqual([1, 0.5]);
    });

    it('reads the longer screen axis regardless of orientation', () => {
        expect(getAssetResolutions(640, 360, 1)).toEqual([0.5, 1]);
        expect(getAssetResolutions(1080, 1920, 1)).toEqual([1, 0.5]);
    });
});

describe('texture preference against pixi resolution variants', () => {
    // The four descriptors AssetPack emits for one atlas, in the arbitrary
    // (hash-dependent) order the generated manifest may list them.
    const sheets = [
        'sprites/sheet@0.5x.png.json',
        'sprites/sheet.png.json',
        'sprites/sheet.webp.json',
        'sprites/sheet@0.5x.webp.json',
    ];

    const resolveSheet = (resolution: number[]) => {
        const resolver = new Resolver();

        // The parser list pixi auto-registers, same as the game gets.
        resolver.parsers.push(...Assets.resolver.parsers);
        resolver.add({ alias: 'sheet', src: [...sheets] });
        resolver.prefer({ params: { format: ['webp', 'png'], resolution } });

        return resolver.resolve('sheet').src;
    };

    it('selects the full atlas for a big screen', () => {
        expect(resolveSheet(getAssetResolutions(1920, 1080, 1))).toBe(
            'sprites/sheet.webp.json',
        );
    });

    it('selects the half atlas for a small screen', () => {
        expect(resolveSheet(getAssetResolutions(360, 640, 1))).toBe(
            'sprites/sheet@0.5x.webp.json',
        );
    });
});
