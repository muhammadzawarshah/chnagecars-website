const financeFactor = 0.012887;

export function priceToMonthly(price: number) {
    return Math.round(price * financeFactor);
}

export function monthlyToPrice(monthly: number) {
    return Math.round(monthly / financeFactor);
}
