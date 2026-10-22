import { Activity, DealerStatus, DealerSummary, InventoryItem, Lead, PlatformOverview } from "./types"
import { authGet, backendPost, queryString } from "../backend/client"

// The extracted console always uses authenticated backend data.
export async function getDealers(): Promise<DealerSummary[]> {
    return (await authGet<DealerSummary[]>("/web/dashboard/dealers")) ?? [];
}
export async function getDealer(id: string): Promise<DealerSummary | undefined> {
    return /^[\w-]{1,64}$/.test(id) ? authGet<DealerSummary>(`/web/dashboard/dealers/${id}`) : undefined;
}
export async function getDealersById(ids: string[]): Promise<DealerSummary[]> {
    return ids.length ? (await authGet<DealerSummary[]>(`/web/dashboard/dealers-by-id${queryString({ ids: ids.join(",") })}`)) ?? [] : [];
}
export async function getInventory(dealerId?: string): Promise<InventoryItem[]> {
    return (await authGet<InventoryItem[]>(`/web/dashboard/inventory${queryString({ dealerId })}`)) ?? [];
}
export async function getLeads(dealerId?: string): Promise<Lead[]> {
    return (await authGet<Lead[]>(`/web/dashboard/leads${queryString({ dealerId })}`)) ?? [];
}
export async function getActivity(): Promise<Activity[]> {
    return (await authGet<Activity[]>("/web/dashboard/activity")) ?? [];
}
export async function getPlatformOverview(): Promise<PlatformOverview> {
    const overview = await authGet<PlatformOverview>("/web/dashboard/overview");
    if (!overview) throw new Error("Platform overview is unavailable for this account.");
    return overview;
}
export async function updateDealerStatus(id: string, status: DealerStatus): Promise<void> {
    await backendPost(`/web/dashboard/dealers/${id}/status`, { status }, { auth: true });
}
