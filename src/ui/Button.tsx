import type { ComponentProps } from 'react';
import { sound } from 'controllers/sound.controller';

// Every overlay button: `press` asks the pointer back off the overlay (see
// `ui.css`), and the click sounds on the press, the way the spin button's does.
export function Button({
    className,
    onPointerDown,
    onClick,
    ...props
}: ComponentProps<'button'>) {
    return (
        <button
            {...props}
            className={className ? `press ${className}` : 'press'}
            onPointerDown={(event) => {
                sound.play('click');
                onPointerDown?.(event);
            }}
            // A button worked from the keyboard is clicked without ever being
            // pressed (`detail` counts the presses behind a click), so the
            // click the pointer never made is sounded here.
            onClick={(event) => {
                if (event.detail === 0) sound.play('click');
                onClick?.(event);
            }}
        />
    );
}
