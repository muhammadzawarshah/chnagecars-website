import { Activity, Dealer, DealerStats, DealerStatus, DealerSummary, InventoryItem, Lead, PlatformOverview, StaffUser } from "./types"
import { mockActivity, mockDealerStats, mockDealers, mockInventory, mockLeads, mockStaff, months } from "./mockData"

// Every dashboard screen gets its data from here. When the backend is ready, replace each
// function body with a fetch to the matching endpoint; screens stay the same.
// e.g. getDealers → fetch(`${process.env.API_URL}/admin/dealers`, { headers: auth })

function statsFor(dealer: Dealer): DealerStats {
    const stock = mockInventory.filter((item) => item.dealerId === dealer.id && item.status === "active");
    return {
        ...mockDealerStats[dealer.id],
        activeListings: stock.length,
        stockValue: stock.reduce((sum, item) => sum + item.price, 0),
    };
}

export async function getDealers(): Promise<DealerSummary[]> {
    return mockDealers.map((dealer) => ({ ...dealer, stats: statsFor(dealer) }));
}

export async function getDealer(id: string): Promise<DealerSummary | undefined> {
    const dealer = mockDealers.find((item) => item.id === id);
    return dealer && { ...dealer, stats: statsFor(dealer) };
}

export async function getDealersById(ids: string[]): Promise<DealerSummary[]> {
    const dealers = await getDealers();
    return ids.map((id) => dealers.find((dealer) => dealer.id === id)).filter((dealer): dealer is DealerSummary => !!dealer);
}

export async function getInventory(dealerId?: string): Promise<InventoryItem[]> {
    return mockInventory.filter((item) => !dealerId || item.dealerId === dealerId);
}

export async function getLeads(dealerId?: string): Promise<Lead[]> {
    return mockLeads.filter((lead) => !dealerId || lead.dealerId === dealerId);
}

export async function getStaff(): Promise<StaffUser[]> {
    return mockStaff;
}

export async function getActivity(): Promise<Activity[]> {
    return mockActivity;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
    const dealers = await getDealers();
    const sumMonthly = (key: "monthlyLeads" | "monthlySold") => months.map((month, index) => ({
        month,
        value: dealers.reduce((sum, dealer) => sum + dealer.stats[key][index].value, 0),
    }));
    return {
        dealers: dealers.length,
        activeDealers: dealers.filter((dealer) => dealer.status === "active").length,
        pendingDealers: dealers.filter((dealer) => dealer.status === "pending").length,
        activeListings: dealers.reduce((sum, dealer) => sum + dealer.stats.activeListings, 0),
        leads: dealers.reduce((sum, dealer) => sum + dealer.stats.leads, 0),
        views: dealers.reduce((sum, dealer) => sum + dealer.stats.views, 0),
        soldThisMonth: dealers.reduce((sum, dealer) => sum + dealer.stats.soldThisMonth, 0),
        stockValue: dealers.reduce((sum, dealer) => sum + dealer.stats.stockValue, 0),
        monthlyLeads: sumMonthly("monthlyLeads"),
        monthlySold: sumMonthly("monthlySold"),
    };
}

// Backend: PATCH /admin/dealers/:id { status }. Mock changes last until the dev server restarts.
export async function updateDealerStatus(id: string, status: DealerStatus): Promise<void> {
    const dealer = mockDealers.find((item) => item.id === id);
    if (dealer) dealer.status = status;
}
