// Split into threes by a space: a comma or a dot each read as a decimal point
// somewhere, and the game deals in whole coins only.
export function formatAmount(amount: number) {
    return amount.toString().replace(/\B(?=(\d{3})+$)/g, ' ');
}
