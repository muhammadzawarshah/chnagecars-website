import { MonthlyPoint } from "@/app/lib/dashboard/types"

export { formatRand } from "@/app/lib/cars/format"

export function formatNumber(value: number) {
    return Math.round(value).toLocaleString("en-US").replace(/,/g, " ");
}

export function formatCompactRand(value: number) {
    if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}m`;
    if (value >= 1_000) return `R${Math.round(value / 1_000)}k`;
    return `R${value}`;
}

export function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`;
}

export function formatDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso.length > 10 ? `${iso}:00Z` : `${iso}T00:00:00Z`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(iso: string) {
    if (!iso) return "—";
    return new Date(`${iso}:00Z`).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

// Month-on-month change of the last point, e.g. 0.12 for +12%.
export function lastChange(points: MonthlyPoint[]) {
    const [previous, current] = points.slice(-2).map((point) => point.value);
    return previous ? (current - previous) / previous : 0;
}

export const table = {
    wrap: "-mx-5 overflow-x-auto max-[600px]:-mx-4",
    table: "w-full min-w-120 border-collapse text-left text-sm",
    head: "border-b border-[#ebe8e1] px-5 py-2.5 text-xs font-bold tracking-wide whitespace-nowrap text-[#6b6862] uppercase max-[600px]:px-4",
    cell: "border-b border-[#f2f0ec] px-5 py-3 align-middle text-ink max-[600px]:px-4",
    row: "transition-colors hover:bg-[#faf8f4]",
}

export const button = {
    gold: "inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-lg border-0 bg-gold px-4 text-sm font-bold whitespace-nowrap text-white no-underline transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40",
    outline: "inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-lg border border-[#d9d4c8] bg-white px-4 text-sm font-bold whitespace-nowrap text-ink no-underline transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40",
    small: "inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-md border border-[#d9d4c8] bg-white px-2.5 text-xs font-bold whitespace-nowrap text-ink no-underline transition hover:border-gold hover:text-gold",
}

export const input = "h-9.5 rounded-lg border border-[#d9d4c8] bg-white px-3 text-sm text-ink outline-none focus:border-gold";
