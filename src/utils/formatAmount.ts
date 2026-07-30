// Every figure of money the game reads out is split into threes from the right
// by a space, so a win or a bet in the thousands is taken in at a glance rather
// than counted digit by digit. A space rather than a comma or a dot: those are
// both a decimal point somewhere, and the game deals in whole coins only.
export const formatAmount = (amount: number) =>
    amount.toString().replace(/\B(?=(\d{3})+$)/g, ' ');
