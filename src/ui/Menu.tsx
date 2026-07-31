import { useEffect } from 'react';
import { useStore } from 'zustand';
import type { CSSProperties, ReactNode } from 'react';
import { sound } from 'controllers/sound.controller';
import { graphicsStore } from 'store/graphics.store';
import { soundStore } from 'store/sound.store';
import { Balance } from 'ui/Balance';
import { Button } from 'ui/Button';
import { Rules } from 'ui/Rules';

// The two entries on the menu that stand something down of their own rather than
// switching something on it. Only ever one of them is let out at a time, which is
// the drop's height held to something the screen has room for.
export type Section = 'rules' | 'balance';

// What the player can set about the game rather than play of it: the sound, how
// it is drawn, and the rules and the balance, each let down inside the menu on
// the entry that names it.
//
// It drops out of the bar rather than covering the machine: it is cut to the bar,
// so it reads as the machine turned round rather than a sheet put over it. It
// stays in the DOM shut as well as open, so the one class animates it both down
// and back up (see `ui.css`) — hidden while it is away, which takes it off the
// keyboard along with the screen.
export function Menu({
    open,
    section,
    onSection,
    onClose,
}: {
    open: boolean;
    section?: Section;
    onSection: (section: Section) => void;
    onClose: () => void;
}) {
    const { muted, volumes, setMuted, setVolume } = useStore(soundStore);
    const { shader, setShader } = useStore(graphicsStore);

    // Shut on Escape, the way the whole drawer is, and only while it is open:
    // shut, the key is the game's again.
    useEffect(() => {
        if (!open) return;

        const close = ({ key }: KeyboardEvent) => {
            if (key === 'Escape') onClose();
        };

        window.addEventListener('keydown', close);

        return () => window.removeEventListener('keydown', close);
    }, [open, onClose]);

    return (
        <div className={`menu${open ? ' menu-open' : ''}`}>
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

            {/* Dimmed rather than taken away while the game is muted: the levels
                are still the player's to set, they just are not being heard at
                the moment. */}
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
                    // Nothing on screen says how loud the effects have been set,
                    // so one is played back at the new level as the handle is let
                    // go and the player hears what they have chosen.
                    onRelease={() => sound.play('click')}
                />
            </div>

            {/* The burn over the background costs the machine a pass of every
                frame, so it is the player's to switch off on one the game runs
                poorly on (see `BG.ts`). */}
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

            <Fold
                label="Game rules"
                open={section === 'rules'}
                onToggle={() => onSection('rules')}
            >
                <Rules />
            </Fold>

            <Fold
                label="Update balance"
                open={section === 'balance'}
                onToggle={() => onSection('balance')}
            >
                <Balance open={section === 'balance'} onClose={onClose} />
            </Fold>
        </div>
    );
}

// An entry and what it has to stand down, as the one row of the menu: shut, the
// section under it takes up none of the drop's height, so the two entries read as
// two more lines of the menu until one of them is asked for.
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
                {/* Lying on its side while the section is shut and turned down
                    onto it once it is open, so the one glyph says both which way
                    the section goes and which way it is standing. */}
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
                // How far along the handle is, as the share of the way it stands
                // at rather than as a distance: the groove works out where the
                // gold gives out from it, which is under the middle of the handle
                // and not at that share of the whole groove (see `ui.css`). A
                // track has no way of reading the value it belongs to, so it is
                // told.
                style={{ '--filled': `${value}` } as CSSProperties}
                onChange={(event) => onChange(event.target.valueAsNumber)}
                onPointerUp={onRelease}
                onKeyUp={onRelease}
            />
            <span className="volume-value gold">
                {Math.round(value * 100)}%
            </span>
        </label>
    );
}
