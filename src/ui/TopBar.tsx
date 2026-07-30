import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { gameTitle } from 'config/game.name';
import { settings } from 'config/game.settings';
import { gameStore } from 'store/game.store';
import type { RootLayout } from 'layout/Root.layout';
import { Balance } from 'ui/Balance';
import { Button } from 'ui/Button';
import { Menu } from 'ui/Menu';
import { Rules } from 'ui/Rules';

// The pop ups the bar opens, only ever one at a time: each covers the game, and
// two of them would be read through one another.
type Popup = 'menu' | 'rules' | 'balance';

// The session is as old as the module: the UI is mounted with the game, so this
// is stamped as the page finishes opening it.
const SESSION_START = Date.now();

// The machine is placed by its grid, so its bounds are the reels alone, at
// whatever size the game has been laid out at. Taken as a plain pair, since what
// comes back is Pixi's own bounds and is written over the next time anything is
// measured.
const reelSize = (layout: RootLayout) => {
    const { width, height } = layout.slotMachine.getBounds();

    return { width, height };
};

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
    // Whether the game has nothing left to stake: a balance short of the
    // smallest bet it deals in, read only between spins, since a running one has
    // had its stake taken and its win still to pay (see `game.controller.ts`).
    const outOfFunds = useStore(
        gameStore,
        ({ state, balance }) => state === 'idle' && balance < settings.minBet,
    );
    const [now, setNow] = useState(() => new Date());
    // What the reels measure on screen. The bar is hung off the top of that, so
    // it reads as the top of the same machine rather than as something laid
    // over it, and the pop ups are cut to the same block, so opening one is the
    // machine turned round rather than a sheet of its own put over the game.
    const [reels, setReels] = useState(() => reelSize(layout));
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
        const measure = () => setReels(reelSize(layout));

        // The game lays itself out on the same event and listens for it first,
        // so the reels have already moved by the time they are measured here.
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, [layout]);

    // A game that will not spin again is put on the one figure that can change
    // that, rather than left saying so over the reels and waiting to be found:
    // the sheet comes up of its own accord as the balance runs out. Closed on a
    // balance still out, it stays closed — the news is over the reels behind it,
    // and the bar opens it again.
    useEffect(() => {
        if (outOfFunds) setPopup('balance');
    }, [outOfFunds]);

    return (
        <>
            <div className="topbar" style={{ width: reels.width }}>
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
                    width={reels.width}
                    height={reels.height}
                    onClose={close}
                    // The menu is a way in to the rules and the balance and not
                    // a place to come back to, so it is left behind rather than
                    // sat under them.
                    onRules={() => setPopup('rules')}
                    onBalance={() => setPopup('balance')}
                />
            )}
            {/* The one sheet handed no measurement of the machine: the rules
                take the screen rather than the reels. */}
            {popup === 'rules' && <Rules onClose={close} />}
            {popup === 'balance' && (
                <Balance width={reels.width} onClose={close} />
            )}
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
