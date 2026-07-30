import { useStore } from 'zustand';
import type { CSSProperties } from 'react';
import { sound } from 'controllers/sound.controller';
import { graphicsStore } from 'store/graphics.store';
import { soundStore } from 'store/sound.store';
import { Button } from 'ui/Button';
import { Dialog } from 'ui/Dialog';

// What the player can set about the game rather than play of it: the sound, how
// it is drawn, and the way in to the rules and to the balance.
export function Menu({
    width,
    height,
    onClose,
    onRules,
    onBalance,
}: {
    width: number;
    height: number;
    onClose: () => void;
    onRules: () => void;
    onBalance: () => void;
}) {
    const { muted, volumes, setMuted, setVolume } = useStore(soundStore);
    const { shader, setShader } = useStore(graphicsStore);

    return (
        // The whole of the reels, and not the width of them alone: what the
        // menu stands down is four short rows, and they are spread over the
        // machine rather than gathered at the top of a sheet the size of it.
        <Dialog title="Menu" width={width} minHeight={height} onClose={onClose}>
            <div className="menu">
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

                {/* Dimmed rather than taken away while the game is muted: the
                    levels are still the player's to set, they just are not
                    being heard at the moment. */}
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
                        // Nothing on screen says how loud the effects have been
                        // set, so one is played back at the new level as the
                        // handle is let go and the player hears what they have
                        // chosen.
                        onRelease={() => sound.play('click')}
                    />
                </div>

                {/* The burn over the background costs the machine a pass of
                    every frame, so it is the player's to switch off on one the
                    game runs poorly on (see `BG.ts`). */}
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

                <Button className="menu-entry" onClick={onRules}>
                    <span className="menu-label">Game rules</span>
                    <span className="gold">›</span>
                </Button>

                <Button className="menu-entry" onClick={onBalance}>
                    <span className="menu-label">Update balance</span>
                    <span className="gold">›</span>
                </Button>
            </div>
        </Dialog>
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
                // How far along the handle is, as the share of the way it
                // stands at rather than as a distance: the groove works out
                // where the gold gives out from it, which is under the middle
                // of the handle and not at that share of the whole groove (see
                // `ui.css`). A track has no way of reading the value it belongs
                // to, so it is told.
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
