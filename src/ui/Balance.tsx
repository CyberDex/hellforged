import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { game } from 'controllers/game.controller';
import { gameStore } from 'store/game.store';
import { Button } from 'ui/Button';

// The one figure in the game the player writes rather than plays for. It is
// handed to the game rather than to the store, so the machine settles around
// what was typed (see `game.controller.ts`).
//
// Let down inside the menu rather than opened over the game (see `Menu.tsx`), and
// the figure is taken as it is: a balance is corrected rather than remembered and
// retyped, and the whole of it is under the caret to be typed over.
export function Balance({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [amount, setAmount] = useState('');
    const field = useRef<HTMLInputElement>(null);

    // The balance as it stands the moment the section is let down, and taken
    // rather than waiting to be clicked into: the game puts this one up itself as
    // the balance runs out (see `TopBar.tsx`), and there is nothing else on it to
    // do. Read off the store here rather than watched, since a section standing
    // open is a figure being typed and a win landing behind it is not to be
    // written over the top of that.
    useEffect(() => {
        if (!open) return;

        setAmount(gameStore.getState().balance.toString());
        field.current?.focus();
    }, [open]);

    const submit = (event: FormEvent) => {
        // There is no page here to reload.
        event.preventDefault();

        game.updateBalance(Math.floor(Number(amount)));
        // The figure is set and there is nothing more to do on the drawer, so it
        // goes rather than being left standing open over the reels.
        onClose();
    };

    return (
        <form className="balance" onSubmit={submit}>
            {/* Whole coins and never in debt, which the field turns away itself:
                the form will not submit on anything else. */}
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
