import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStore } from 'zustand';
import { game } from 'controllers/game.controller';
import { gameStore } from 'store/game.store';
import { Button } from 'ui/Button';
import { Dialog } from 'ui/Dialog';

// The one figure in the game the player writes rather than plays for. It is
// handed to the game rather than to the store, so the machine settles around
// what was typed (see `game.controller.ts`).
export function Balance({ onClose }: { onClose: () => void }) {
    const balance = useStore(gameStore, (state) => state.balance);
    // Opens on what the player has, so a balance is corrected rather than
    // remembered and retyped.
    const [amount, setAmount] = useState(() => balance.toString());

    const submit = (event: FormEvent) => {
        // There is no page here to reload.
        event.preventDefault();

        game.updateBalance(Math.floor(Number(amount)));
        onClose();
    };

    return (
        <Dialog title="Balance" onClose={onClose}>
            <form className="balance" onSubmit={submit}>
                {/* Whole coins and never in debt, which the field turns away
                    itself: the form will not submit on anything else. */}
                <input
                    className="balance-field"
                    type="number"
                    min={0}
                    step={1}
                    required
                    autoFocus
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                />
                <Button className="balance-apply" type="submit">
                    Update
                </Button>
            </form>
        </Dialog>
    );
}
