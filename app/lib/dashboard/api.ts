import { Activity, Dealer, DealerStats, DealerStatus, DealerSummary, InventoryItem, Lead, PlatformOverview, StaffUser } from "./types"
import { mockActivity, mockDealerStats, mockDealers, mockInventory, mockLeads, mockStaff, months } from "./mockData"
import { authGet, backendEnabled, backendPost, queryString } from "../backend/client"

// Every dashboard screen gets its data from here. With API_URL set, each function reads the
// ChangeCars API as the signed-in user (backend/src/modules/web, same shapes as ./types); the
// API decides what that user may see. Without API_URL the sample data below is used.

function statsFor(dealer: Dealer): DealerStats {
    const stock = mockInventory.filter((item) => item.dealerId === dealer.id && item.status === "active");
    return {
        ...mockDealerStats[dealer.id],
        activeListings: stock.length,
        stockValue: stock.reduce((sum, item) => sum + item.price, 0),
    };
}

export async function getDealers(): Promise<DealerSummary[]> {
    if (backendEnabled()) return (await authGet<DealerSummary[]>("/web/dashboard/dealers")) ?? [];
    return mockDealers.map((dealer) => ({ ...dealer, stats: statsFor(dealer) }));
}

export async function getDealer(id: string): Promise<DealerSummary | undefined> {
    if (backendEnabled()) return /^[\w-]{1,64}$/.test(id) ? authGet<DealerSummary>(`/web/dashboard/dealers/${id}`) : undefined;
    const dealer = mockDealers.find((item) => item.id === id);
    return dealer && { ...dealer, stats: statsFor(dealer) };
}

export async function getDealersById(ids: string[]): Promise<DealerSummary[]> {
    if (backendEnabled()) return ids.length ? (await authGet<DealerSummary[]>(`/web/dashboard/dealers-by-id${queryString({ ids: ids.join(",") })}`)) ?? [] : [];
    const dealers = await getDealers();
    return ids.map((id) => dealers.find((dealer) => dealer.id === id)).filter((dealer): dealer is DealerSummary => !!dealer);
}

export async function getInventory(dealerId?: string): Promise<InventoryItem[]> {
    if (backendEnabled()) return (await authGet<InventoryItem[]>(`/web/dashboard/inventory${queryString({ dealerId })}`)) ?? [];
    return mockInventory.filter((item) => !dealerId || item.dealerId === dealerId);
}

export async function getLeads(dealerId?: string): Promise<Lead[]> {
    if (backendEnabled()) return (await authGet<Lead[]>(`/web/dashboard/leads${queryString({ dealerId })}`)) ?? [];
    return mockLeads.filter((lead) => !dealerId || lead.dealerId === dealerId);
}

export async function getStaff(): Promise<StaffUser[]> {
    if (backendEnabled()) return (await authGet<StaffUser[]>("/web/dashboard/staff")) ?? [];
    return mockStaff;
}

export async function getActivity(): Promise<Activity[]> {
    if (backendEnabled()) return (await authGet<Activity[]>("/web/dashboard/activity")) ?? [];
    return mockActivity;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
    if (backendEnabled()) {
        const overview = await authGet<PlatformOverview>("/web/dashboard/overview");
        if (overview) return overview;
    }
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

// API: POST /web/dashboard/dealers/:id/status { status }. Mock changes last until the dev server restarts.
export async function updateDealerStatus(id: string, status: DealerStatus): Promise<void> {
    if (backendEnabled()) {
        await backendPost(`/web/dashboard/dealers/${id}/status`, { status }, { auth: true });
        return;
    }
    const dealer = mockDealers.find((item) => item.id === id);
    if (dealer) dealer.status = status;
}
