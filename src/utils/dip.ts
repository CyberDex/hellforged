// 0 -> 1 -> 0 ease: down with momentum until `at`, then eased back to rest.
export const dip =
    (at: number) =>
    (progress: number): number => {
        if (progress < at) {
            const down = progress / at;

            return down * (2 - down);
        }

        const back = (progress - at) / (1 - at);

        return (1 + Math.cos(back * Math.PI)) / 2;
    };
