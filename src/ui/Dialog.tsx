import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'ui/Button';

// The frame every pop up is drawn in: one of the game's pannels, over a veil
// that dims what it is covering. The veil also takes back the pointers the
// overlay passes through to the canvas, so the reels cannot be played from
// behind a dialog and a click anywhere off it closes it.
//
// A sheet is cut to the reels rather than to a width of its own, so it covers
// the machine squarely and reads as the same block of it: whoever opens one has
// already measured them for the bar along the top and hands the figure down
// (see `TopBar.tsx`). A height is only given by a sheet with little enough on it
// to look lost at that size, which is the menu.
export function Dialog({
    className,
    title,
    width,
    minHeight,
    onClose,
    children,
}: {
    className?: string;
    title: string;
    width?: number;
    minHeight?: number;
    onClose: () => void;
    children: ReactNode;
}) {
    useEffect(() => {
        const close = ({ key }: KeyboardEvent) => {
            if (key === 'Escape') onClose();
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [onClose]);

    return (
        <div className="backdrop" onClick={onClose}>
            <div
                className={className ? `dialog ${className}` : 'dialog'}
                style={{ width, minHeight }}
                role="dialog"
                aria-label={title}
                // The sheet sits inside what closes it, so its own clicks stop
                // here rather than carrying on to the veil.
                onClick={(event) => event.stopPropagation()}
            >
                <div className="dialog-head">
                    <span className="dialog-title gold">{title}</span>
                    <Button
                        className="dialog-close gold"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ×
                    </Button>
                </div>
                {children}
            </div>
        </div>
    );
}
