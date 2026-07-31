import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { game } from 'controllers/game.controller';
import { gameStore } from 'store/game.store';
import { Button } from 'ui/Button';

// Handed to the game rather than to the store, so the machine settles around
// what was typed (see `game.controller.ts`).
export function Balance({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [amount, setAmount] = useState('');
    const field = useRef<HTMLInputElement>(null);

    // Read off the store rather than watched: a section standing open is a
    // figure being typed, and a win landing behind it must not write over it.
    useEffect(() => {
        if (!open) return;

        setAmount(gameStore.getState().balance.toString());
        field.current?.focus();
    }, [open]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        game.updateBalance(Math.floor(Number(amount)));
        onClose();
    };

    return (
        <form className="balance" onSubmit={submit}>
            {/* Whole coins and never in debt: the form will not submit on
                anything else. */}
            <input
                ref={field}
                className="balance-field"
                type="number"
                min={0}
                step={1}
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
            />
            <Button className="balance-apply" type="submit">
                Update
            </Button>
        </form>
    );
}
