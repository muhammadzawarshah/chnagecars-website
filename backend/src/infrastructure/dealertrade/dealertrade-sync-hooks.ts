/** Work to run after each completed full DealerTrade sync (kept free of imports so the sync stays light). */
export const afterDealerTradeSync = new Set<() => void>();
