import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'ui/Button';

// The frame every pop up is drawn in: one of the game's pannels, over a veil
// that dims what it is covering. The veil also takes back the pointers the
// overlay passes through to the canvas, so the reels cannot be played from
// behind a dialog and a click anywhere off it closes it.
export function Dialog({
    className,
    title,
    onClose,
    children,
}: {
    className?: string;
    title: string;
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
