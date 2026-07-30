import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { gameTitle } from 'config/game.name';
import { gameStore } from 'store/game.store';
import type { RootLayout } from 'layout/Root.layout';
import { Balance } from 'ui/Balance';
import { Button } from 'ui/Button';
import { Menu } from 'ui/Menu';

// The pop ups the bar opens, only ever one at a time: each covers the game, and
// two of them would be read through one another.
type Popup = 'menu' | 'balance';

// The session is as old as the module: the UI is mounted with the game, so this
// is stamped as the page finishes opening it.
const SESSION_START = Date.now();

// The machine is placed by its grid, so its bounds are the reels alone, at
// whatever size the game has been laid out at.
const reelWidth = (layout: RootLayout) => layout.slotMachine.getBounds().width;

const clock = (date: Date) =>
    date.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

// Hours:minutes, so the session reads the same way the clock beside it does
// rather than as a count of minutes.
function elapsed(ms: number) {
    const minutes = Math.floor(ms / 60000);

    return [minutes / 60, minutes % 60]
        .map((part) => Math.floor(part).toString().padStart(2, '0'))
        .join(':');
}

export function TopBar({ layout }: { layout: RootLayout }) {
    // Straight off the game's own store, so the bar reads the same balance the
    // reels are played with and there is no second copy of it to keep in step.
    const balance = useStore(gameStore, (state) => state.balance);
    const [now, setNow] = useState(() => new Date());
    // As wide as the reels are on screen, so the bar reads as the top of the
    // same machine rather than as something laid over it.
    const [width, setWidth] = useState(() => reelWidth(layout));
    const [popup, setPopup] = useState<Popup>();
    // Held still, since every dialog listens for the Escape that calls it.
    const close = useCallback(() => setPopup(undefined), []);

    // Both clocks are driven by the one hand. Neither reads out seconds, but it
    // still beats every second, so a minute turns over as it actually does
    // rather than up to a minute late.
    useEffect(() => {
        const tick = setInterval(() => setNow(new Date()), 1000);

        return () => clearInterval(tick);
    }, []);

    useEffect(() => {
        const measure = () => setWidth(reelWidth(layout));

        // The game lays itself out on the same event and listens for it first,
        // so the reels have already moved by the time they are measured here.
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, [layout]);

    return (
        <>
            <div className="topbar" style={{ width }}>
                <div className="topbar-left">
                    {/* The three bars are drawn in CSS, so the button carries
                        no glyph the game font would have to have. */}
                    <Button
                        className="topbar-menu"
                        aria-label="Menu"
                        onClick={() => setPopup('menu')}
                    />
                    {/* The balance is the way in to setting it, so the figure
                        the player wants to change is itself the control. */}
                    <Button onClick={() => setPopup('balance')}>
                        <Stat
                            label="Balance"
                            value={balance.toLocaleString()}
                        />
                    </Button>
                </div>
                <span className="topbar-title gold">{gameTitle}</span>
                <div className="topbar-clocks">
                    <Stat label="Time" value={clock(now)} />
                    <Stat
                        label="Session"
                        value={elapsed(now.getTime() - SESSION_START)}
                    />
                </div>
            </div>
            {popup === 'menu' && (
                <Menu
                    onClose={close}
                    // The menu is a way in to the balance and not a place to
                    // come back to, so it is left behind rather than under.
                    onBalance={() => setPopup('balance')}
                />
            )}
            {/* The one sheet handed no measurement of the machine: the rules
                take the screen rather than the reels. */}
            {popup === 'balance' && <Balance onClose={close} />}
        </>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <span className="topbar-stat">
            <span className="topbar-label">{label}</span>
            <span className="topbar-value gold">{value}</span>
        </span>
    );
}
