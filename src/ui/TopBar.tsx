import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useStore } from 'zustand';
import { gameTitle } from 'config/game.name';
import { gmeSettings } from 'config/game.settings';
import { gameStore } from 'store/game.store';
import { uiStore } from 'store/ui.store';
import { Button } from 'ui/Button';
import { Menu } from 'ui/Menu';
import { Rules } from 'ui/Rules';
import { useCountUp } from 'ui/useCountUp';
import { formatAmount } from 'utils/formatAmount';

// Only one open at a time; the rules sheet takes the drawer's place.
type Open = 'menu' | 'balance' | 'rules';

const SESSION_START = Date.now();

const clock = (date: Date) =>
    date.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

function elapsed(ms: number) {
    const minutes = Math.floor(ms / 60000);

    return [minutes / 60, minutes % 60]
        .map((part) => Math.floor(part).toString().padStart(2, '0'))
        .join(':');
}

export function TopBar() {
    const balance = useStore(gameStore, (state) => state.balance);
    // The reading of the balance, never what anything is played with.
    const counted = useCountUp(balance, gmeSettings.balanceCountDuration);
    // Only between spins: a running spin has had its stake taken already.
    const outOfFunds = useStore(
        gameStore,
        ({ state, balance }) =>
            state === 'idle' && balance < gmeSettings.minBet,
    );
    const [now, setNow] = useState(() => new Date());
    const [open, setOpen] = useState<Open>();
    const menuButton = useRef<HTMLButtonElement>(null);
    const drawer = open === 'menu' || open === 'balance';
    // Held still: the drawer and the sheet both listen for the Escape.
    const close = useCallback(() => {
        setOpen(undefined);
        menuButton.current?.focus();
    }, []);

    // Beats every second so a minute turns over on time, though neither
    // clock shows seconds.
    useEffect(() => {
        const tick = setInterval(() => setNow(new Date()), 1000);

        return () => clearInterval(tick);
    }, []);

    // Comes down on the balance section as it runs out; closed again on a
    // balance still out, it stays closed.
    useEffect(() => {
        if (outOfFunds) setOpen('balance');
    }, [outOfFunds]);

    useLayoutEffect(() => {
        const { setOverlayOpen } = uiStore.getState();

        setOverlayOpen(Boolean(open));

        return () => setOverlayOpen(false);
    }, [open]);

    return (
        <>
            {/* Before the bar, so the bar and the drop keep their own clicks. */}
            {drawer && <div className="veil" onPointerDown={close} />}
            {/* The drawer hangs off this mount, not the bar, so its glass
                blurs the game rather than the bar's (see `.hud` in ui.css). */}
            <div className="hud">
                <div className="topbar glass">
                    <div className="topbar-left">
                        <Button
                            ref={menuButton}
                            className="topbar-menu"
                            aria-label="Menu"
                            aria-expanded={drawer}
                            aria-controls="menu"
                            onClick={() =>
                                setOpen((was) => (was ? undefined : 'menu'))
                            }
                        />
                        <Button onClick={() => setOpen('balance')}>
                            <Stat
                                label="Balance"
                                value={formatAmount(counted)}
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
                <Menu
                    open={drawer}
                    balance={open === 'balance'}
                    // Asked for again, the section shuts; the drawer stands.
                    onBalance={() =>
                        setOpen((was) =>
                            was === 'balance' ? 'menu' : 'balance',
                        )
                    }
                    onRules={() => setOpen('rules')}
                    onClose={close}
                />
            </div>
            {open === 'rules' && <Rules onClose={close} />}
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
