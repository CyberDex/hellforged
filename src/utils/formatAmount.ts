// Split into threes by a space: a comma or a dot each read as a decimal point
// somewhere, and the game deals in whole coins only.
export const formatAmount = (amount: number) =>
    amount.toString().replace(/\B(?=(\d{3})+$)/g, ' ');
