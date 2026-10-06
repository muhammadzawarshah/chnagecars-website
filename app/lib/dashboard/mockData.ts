import { mockCars } from "../cars/mockCars"
import { Activity, Dealer, DealerStats, InventoryItem, Lead, LeadSource, LeadStatus, ListingStatus, MonthlyPoint, StaffUser } from "./types"

// Sample dashboard data used until the backend is connected. Only api.ts reads this file.
// Generated from a fixed seed so numbers are stable between reloads and server/client renders.

function seeded(seed: number) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const random = seeded(2026);
const between = (min: number, max: number) => Math.round(min + random() * (max - min));
const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];

export const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];

export const mockDealers: Dealer[] = [
    { id: "d1", name: "Rivonia Auto House", contactName: "Thabo Nkosi", email: "sales@rivoniaautohouse.example", phone: "011 555 0101", city: "Sandton", province: "Gauteng", plan: "Gold", status: "active", joinedAt: "2024-03-12", rating: 4.8 },
    { id: "d2", name: "Cape Coastal Motors", contactName: "Lauren Adams", email: "info@capecoastal.example", phone: "021 555 0102", city: "Cape Town", province: "Western Cape", plan: "Gold", status: "active", joinedAt: "2023-11-02", rating: 4.6 },
    { id: "d3", name: "Durban North Car Centre", contactName: "Sipho Mthembu", email: "hello@dncarcentre.example", phone: "031 555 0103", city: "Durban", province: "KwaZulu-Natal", plan: "Silver", status: "active", joinedAt: "2024-06-20", rating: 4.4 },
    { id: "d4", name: "Pretoria East Pre-Owned", contactName: "Annelie Botha", email: "sales@ptaeast.example", phone: "012 555 0104", city: "Pretoria", province: "Gauteng", plan: "Silver", status: "active", joinedAt: "2025-01-15", rating: 4.5 },
    { id: "d5", name: "Bloem Family Motors", contactName: "Johan van Wyk", email: "info@bloemfamily.example", phone: "051 555 0105", city: "Bloemfontein", province: "Free State", plan: "Basic", status: "active", joinedAt: "2025-04-08", rating: 4.2 },
    { id: "d6", name: "Mbombela Vehicle Hub", contactName: "Nomsa Dlamini", email: "sales@mbombelahub.example", phone: "013 555 0106", city: "Mbombela", province: "Mpumalanga", plan: "Basic", status: "pending", joinedAt: "2026-09-21", rating: 0 },
    { id: "d7", name: "Gqeberha Auto Traders", contactName: "Kevin Pillay", email: "deals@gqautotraders.example", phone: "041 555 0107", city: "Gqeberha", province: "Eastern Cape", plan: "Silver", status: "active", joinedAt: "2024-09-30", rating: 4.3 },
    { id: "d8", name: "Polokwane Drive Centre", contactName: "Lerato Mokoena", email: "info@pkdrive.example", phone: "015 555 0108", city: "Polokwane", province: "Limpopo", plan: "Basic", status: "suspended", joinedAt: "2024-12-04", rating: 3.6 },
    { id: "d9", name: "Stellenbosch Prestige Cars", contactName: "Michael Fourie", email: "sales@stbprestige.example", phone: "021 555 0109", city: "Stellenbosch", province: "Western Cape", plan: "Gold", status: "active", joinedAt: "2023-08-17", rating: 4.9 },
    { id: "d10", name: "Rustenburg Bakkie World", contactName: "Pieter Kruger", email: "info@rtbbakkies.example", phone: "014 555 0110", city: "Rustenburg", province: "North West", plan: "Basic", status: "pending", joinedAt: "2026-09-28", rating: 0 },
];

const planSize = { Gold: 1, Silver: 0.6, Basic: 0.35 };

function series(base: number, growth: number): MonthlyPoint[] {
    return months.map((month, index) => ({ month, value: Math.max(0, Math.round(base * (1 + growth * index) * (0.85 + random() * 0.3))) }));
}

const statuses: ListingStatus[] = ["active", "active", "active", "active", "sold", "draft", "flagged"];

export const mockInventory: InventoryItem[] = mockDealers.flatMap((dealer, dealerIndex) => {
    if (dealer.status === "pending") return [];
    const count = Math.round(42 * planSize[dealer.plan]);
    return Array.from({ length: count }, (_, index) => {
        const car = mockCars[(index + dealerIndex * 3) % mockCars.length];
        return {
            id: `${dealer.id}-l${index + 1}`,
            dealerId: dealer.id,
            title: car.title,
            image: car.image,
            price: Math.round((car.price * (0.85 + random() * 0.3)) / 1000) * 1000,
            mileage: Math.round((car.mileage * (0.7 + random() * 0.6)) / 100) * 100,
            status: pick(statuses),
            views: between(40, 2400),
            leads: between(0, 28),
            listedAt: `2026-0${between(6, 9)}-${String(between(1, 28)).padStart(2, "0")}`,
        };
    });
});

const firstNames = ["Ayanda", "Bianca", "Chris", "Dineo", "Ethan", "Fatima", "Gareth", "Hlengiwe", "Imran", "Jessica", "Karabo", "Liam", "Mpho", "Naledi", "Owen", "Priya", "Riaan", "Sanele", "Tamsin", "Zanele"];
const lastNames = ["Molefe", "Smith", "Naidoo", "Khumalo", "Jacobs", "Petersen", "Ndlovu", "Coetzee", "Mahlangu", "Reddy"];
const sources: LeadSource[] = ["Call", "WhatsApp", "Email", "Website form"];
const leadStatuses: LeadStatus[] = ["new", "new", "contacted", "contacted", "won", "lost"];

export const mockLeads: Lead[] = mockDealers.flatMap((dealer) => {
    const stock = mockInventory.filter((item) => item.dealerId === dealer.id);
    if (stock.length === 0) return [];
    return Array.from({ length: Math.round(30 * planSize[dealer.plan]) }, (_, index) => ({
        id: `${dealer.id}-ld${index + 1}`,
        dealerId: dealer.id,
        customer: `${pick(firstNames)} ${pick(lastNames)}`,
        phone: `0${between(60, 84)} ${between(100, 999)} ${between(1000, 9999)}`,
        vehicle: pick(stock).title,
        source: pick(sources),
        status: pick(leadStatuses),
        createdAt: `2026-${random() < 0.25 ? `10-0${between(1, 6)}` : `09-${String(between(1, 30)).padStart(2, "0")}`}T${String(between(8, 17)).padStart(2, "0")}:${pick(["05", "20", "35", "50"])}`,
    }));
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const mockDealerStats: Record<string, Omit<DealerStats, "activeListings" | "stockValue">> = Object.fromEntries(mockDealers.map((dealer) => {
    const size = dealer.status === "pending" ? 0 : planSize[dealer.plan];
    const monthlyLeads = series(110 * size, 0.06);
    const monthlyViews = series(5200 * size, 0.05);
    const monthlySold = series(14 * size, 0.04);
    const leads = monthlyLeads.at(-1)!.value;
    const sold = monthlySold.at(-1)!.value;
    return [dealer.id, {
        soldThisMonth: sold,
        views: monthlyViews.at(-1)!.value,
        leads,
        conversionRate: leads ? sold / leads : 0,
        avgDaysToSell: size ? between(18, 55) : 0,
        responseHours: size ? Math.round((0.5 + random() * 6) * 10) / 10 : 0,
        monthlyLeads,
        monthlyViews,
        monthlySold,
    }];
}));

export const mockStaff: StaffUser[] = [
    { id: "s1", name: "Zawar Shah", email: "zawar@changecars.example", role: "super-admin", status: "active", lastActive: "2026-10-06T09:12" },
    { id: "s2", name: "Natasha Pillay", email: "natasha@changecars.example", role: "admin", status: "active", lastActive: "2026-10-06T08:40" },
    { id: "s3", name: "Ruan Visser", email: "ruan@changecars.example", role: "admin", status: "active", lastActive: "2026-10-05T16:03" },
    { id: "s4", name: "Lindiwe Zulu", email: "lindiwe@changecars.example", role: "admin", status: "invited", lastActive: "" },
];

export const mockActivity: Activity[] = [
    { id: "a1", actor: "Natasha Pillay", action: "flagged a listing from", target: "Polokwane Drive Centre", at: "2026-10-06T08:55" },
    { id: "a2", actor: "System", action: "received a dealer application from", target: "Rustenburg Bakkie World", at: "2026-09-28T11:20" },
    { id: "a3", actor: "Ruan Visser", action: "suspended", target: "Polokwane Drive Centre", at: "2026-09-25T14:02" },
    { id: "a4", actor: "Zawar Shah", action: "upgraded to Gold", target: "Stellenbosch Prestige Cars", at: "2026-09-22T10:31" },
    { id: "a5", actor: "System", action: "received a dealer application from", target: "Mbombela Vehicle Hub", at: "2026-09-21T09:47" },
];
