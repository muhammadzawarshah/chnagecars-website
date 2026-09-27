<<<<<<< HEAD
const financeFactor = 0.012887;
=======
const financeFactor = 0.020206293007844;

export function formatMoney(amount: number) {
    return Math.round(Math.abs(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
>>>>>>> origin/main

export function priceToMonthly(price: number) {
    return Math.round(price * financeFactor);
}

export function monthlyToPrice(monthly: number) {
    return Math.round(monthly / financeFactor);
}
