import type { ComponentProps } from 'react';
import { sound } from 'controllers/sound.controller';

// Every button the overlay lays over the game. It carries the `press` class,
// which is what asks a pointer back off the overlay and takes the browser's own
// dressing off it (see `ui.css`), and it sounds the same click the spin button
// does, on the press rather than on the release, so a button in the DOM answers
// the way the one on the machine does.
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
            // pointed at, and says so: the click counts the presses behind it
            // (`detail`) and that one is made by none. It is the press the
            // pointer never made, so it is clicked here instead.
            onClick={(event) => {
                if (event.detail === 0) sound.play('click');
                onClick?.(event);
            }}
        />
    );
}
