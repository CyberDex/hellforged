import { useEffect } from 'react';
import { useStore } from 'zustand';
import type { CSSProperties, ReactNode } from 'react';
import { Balance } from 'ui/Balance';
import { Button } from 'ui/Button';
import { useRuntime } from 'ui/Runtime';

// Stays in the DOM shut as well as open, so the one class animates the
// drawer both down and back up (see `ui.css`).
export function Menu({
    open,
    balance,
    onBalance,
    onRules,
    onClose,
}: {
    open: boolean;
    balance: boolean;
    onBalance: () => void;
    onRules: () => void;
    onClose: () => void;
}) {
    const { graphicsStore, sound, soundStore } = useRuntime();
    const { muted, volumes, setMuted, setVolume } = useStore(soundStore);
    const { shader, setShader } = useStore(graphicsStore);

    // Only while open: shut, the key is the game's again.
    useEffect(() => {
        if (!open) return;

        const close = ({ key }: KeyboardEvent) => {
            if (key === 'Escape') onClose();
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [open, onClose]);

    return (
        <div id="menu" className={`menu glass${open ? ' menu-open' : ''}`}>
            <div className="menu-row">
                <span className="menu-label">Sound</span>
                <Button
                    className="menu-switch gold"
                    role="switch"
                    aria-checked={!muted}
                    onClick={() => setMuted(!muted)}
                >
                    {muted ? 'Off' : 'On'}
                </Button>
            </div>

            {/* Dimmed, not taken away: the levels stay the player's to set. */}
            <div className={`menu-volumes${muted ? ' menu-muted' : ''}`}>
                <Volume
                    label="Music"
                    value={volumes.music}
                    onChange={(volume) => setVolume('music', volume)}
                />
                <Volume
                    label="Effects"
                    value={volumes.fx}
                    onChange={(volume) => setVolume('fx', volume)}
                    // Played back on release, so the new level is heard.
                    onRelease={() => sound.play('click')}
                />
            </div>

            <div className="menu-row">
                <span className="menu-label">Shader</span>
                <Button
                    className="menu-switch gold"
                    role="switch"
                    aria-checked={shader}
                    onClick={() => setShader(!shader)}
                >
                    {shader ? 'On' : 'Off'}
                </Button>
            </div>

            <Button
                className="menu-entry"
                aria-haspopup="dialog"
                onClick={onRules}
            >
                <span className="menu-label">Game rules</span>
                <span className="menu-chevron gold">›</span>
            </Button>

            <Fold label="Update balance" open={balance} onToggle={onBalance}>
                <Balance open={balance} onClose={onClose} />
            </Fold>
        </div>
    );
}

function Fold({
    label,
    open,
    onToggle,
    children,
}: {
    label: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <div className="menu-fold">
            <Button
                className="menu-entry"
                aria-expanded={open}
                onClick={onToggle}
            >
                <span className="menu-label">{label}</span>
                <span className="menu-chevron gold">›</span>
            </Button>
            <div className={`menu-section${open ? ' menu-section-open' : ''}`}>
                <div className="menu-section-body">{children}</div>
            </div>
        </div>
    );
}

function Volume({
    label,
    value,
    onChange,
    onRelease,
}: {
    label: string;
    value: number;
    onChange: (volume: number) => void;
    onRelease?: () => void;
}) {
    return (
        <label className="volume">
            <span className="menu-label">{label}</span>
            <input
                className="volume-range"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                // The groove cannot read its own value, so it is told where
                // the gold gives out (see `ui.css`).
                style={{ '--filled': `${value}` } as CSSProperties}
                onChange={(event) => onChange(event.target.valueAsNumber)}
                onPointerUp={onRelease}
                onKeyUp={({ key }) => {
                    if (
                        key.startsWith('Arrow') ||
                        ['Home', 'End', 'PageUp', 'PageDown'].includes(key)
                    ) {
                        onRelease?.();
                    }
                }}
            />
            <span className="volume-value gold">
                {Math.round(value * 100)}%
            </span>
        </label>
    );
}
