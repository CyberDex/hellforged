import { useEffect, useRef, useState } from 'react';
import { tween } from 'controllers/tween.controller';

// Carries on from the displayed figure when its target changes mid-count.
export function useCountUp(target: number, duration: number) {
    const [counted, setCounted] = useState(target);
    const reading = useRef(target);

    useEffect(() => {
        const from = reading.current;

        if (target === from) return;

        const count = tween.run({
            duration,
            from,
            to: target,
            onUpdate: (climbing) => {
                reading.current = Math.round(climbing);
                setCounted(reading.current);
            },
        });

        return () => count.stop();
    }, [target, duration]);

    return counted;
}
