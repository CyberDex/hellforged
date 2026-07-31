// The pack ships two texture tiers (1x and @0.5x). The renderer is capped at 2
// (existing clamp), so values above 2 only burn fillrate.
const MAX_RENDER_RESOLUTION = 2;

// Physical pixels above which the @0.5x art upscales visibly: the largest
// source art (bg.png) is 627px in the 0.5x tier, plus ~30% tolerable stretch.
const LOW_TIER_MAX_PHYSICAL = 800;

export function getRenderResolution(dpr = window.devicePixelRatio) {
    return Math.min(dpr, MAX_RENDER_RESOLUTION);
}

// Ordered preference for Assets.init: both tiers are always listed so assets
// that exist in a single resolution still resolve through the fallback.
export function getAssetResolutions(
    screenWidth = window.innerWidth,
    screenHeight = window.innerHeight,
    dpr = window.devicePixelRatio,
) {
    const physical =
        Math.max(screenWidth, screenHeight) * getRenderResolution(dpr);

    return physical <= LOW_TIER_MAX_PHYSICAL ? [0.5, 1] : [1, 0.5];
}
