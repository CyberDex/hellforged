// 0 -> 1 -> 0 ease: down with momentum, then eased back to rest.
export function createBounceEase(downDuration: number) {
    return function bounceEase(progress: number): number {
        if (progress < downDuration) {
            const down = progress / downDuration;

            return down * (2 - down);
        }

        const back = (progress - downDuration) / (1 - downDuration);

        return (1 + Math.cos(back * Math.PI)) / 2;
    };
}
