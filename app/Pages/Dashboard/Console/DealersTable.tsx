"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { setDealerStatus } from "@/app/lib/dashboard/actions"
import { DealerStatus, DealerSummary } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import StatusBadge from "../ui/StatusBadge"
import FilterTabs from "../ui/FilterTabs"
import { button, formatCompactRand, formatNumber, formatPercent, input, table } from "../ui/format"

export const MAX_COMPARE = 4;

type DealersTableProps = {
    dealers: DealerSummary[]
    base: string
    canManage: boolean
    canCompare: boolean
    canViewAs: boolean
}

type Filter = "all" | DealerStatus

export default function DealersTable({ dealers, base, canManage, canCompare, canViewAs }: DealersTableProps) {

    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [pending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<string | null>(null);

    const q = query.trim().toLowerCase();
    const visible = dealers
        .filter((dealer) => filter === "all" || dealer.status === filter)
        .filter((dealer) => !q || `${dealer.name} ${dealer.city} ${dealer.province} ${dealer.contactName}`.toLowerCase().includes(q));

    function toggle(id: string) {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < MAX_COMPARE ? [...current, id] : current);
    }

    function changeStatus(id: string, status: DealerStatus) {
        setBusyId(id);
        startTransition(async () => {
            await setDealerStatus(id, status);
            setBusyId(null);
        });
    }

    const viewAsHref = (id: string) => `${base}/dealers/${id}`;

    return (
        <>
            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <FilterTabs
                        value={filter}
                        onChange={setFilter}
                        options={(["all", "active", "pending", "suspended"] as Filter[]).map((value) => ({ value, label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1), count: value === "all" ? dealers.length : dealers.filter((dealer) => dealer.status === value).length }))}
                    />
                    <label className="relative max-[600px]:w-full">
                        <span className="sr-only">Search dealers</span>
                        <Icon name="search" size={16} className="pointer-events-none absolute top-2.75 left-3 text-[#8a857b]" />
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dealer, city or contact" className={`${input} w-64 pl-9 max-[600px]:w-full`} />
                    </label>
                </div>

                <div className={table.wrap}>
                    <table className={`${table.table} min-w-215`}>
                        <thead>
                            <tr>
                                {canCompare && <th className={`${table.head} w-10`}><span className="sr-only">Compare</span></th>}
                                <th className={table.head}>Dealer</th>
                                <th className={table.head}>Status</th>
                                <th className={table.head}>Listings</th>
                                <th className={table.head}>Leads</th>
                                <th className={table.head}>Lead to sale</th>
                                <th className={table.head}>Stock value</th>
                                <th className={table.head}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((dealer) => {
                                const checked = selected.includes(dealer.id);
                                const busy = pending && busyId === dealer.id;
                                return (
                                    <tr key={dealer.id} className={`${table.row} ${checked ? "bg-[#faf6ec]" : ""}`}>
                                        {canCompare && (
                                            <td className={table.cell}>
                                                <input type="checkbox" checked={checked} disabled={!checked && selected.length >= MAX_COMPARE} onChange={() => toggle(dealer.id)} aria-label={`Compare ${dealer.name}`} className="size-4 cursor-pointer accent-gold" />
                                            </td>
                                        )}
                                        <td className={table.cell}>
                                            {canViewAs && dealer.status !== "pending"
                                                ? <Link href={viewAsHref(dealer.id)} className="font-bold text-ink no-underline hover:text-gold">{dealer.name}</Link>
                                                : <span className="font-bold">{dealer.name}</span>}
                                            <p className="m-0 text-xs whitespace-nowrap text-[#6b6862]"><span className={`font-bold ${dealer.plan === "Gold" ? "text-gold" : ""}`}>{dealer.plan}</span> · {dealer.city}, {dealer.province} · {dealer.contactName}</p>
                                        </td>
                                        <td className={table.cell}><StatusBadge status={dealer.status} /></td>
                                        <td className={`${table.cell} tabular-nums`}>{formatNumber(dealer.stats.activeListings)}</td>
                                        <td className={`${table.cell} tabular-nums`}>{formatNumber(dealer.stats.leads)}</td>
                                        <td className={`${table.cell} tabular-nums`}>{dealer.stats.leads ? formatPercent(dealer.stats.conversionRate) : "—"}</td>
                                        <td className={`${table.cell} tabular-nums`}>{dealer.stats.stockValue ? formatCompactRand(dealer.stats.stockValue) : "—"}</td>
                                        <td className={table.cell}>
                                            <div className="flex justify-end gap-1.5">
                                                {canManage && dealer.status === "pending" && <button type="button" disabled={busy} onClick={() => changeStatus(dealer.id, "active")} className={button.small}>{busy ? "Saving…" : "Approve"}</button>}
                                                {canManage && dealer.status === "active" && <button type="button" disabled={busy} onClick={() => changeStatus(dealer.id, "suspended")} className={button.small}>{busy ? "Saving…" : "Suspend"}</button>}
                                                {canManage && dealer.status === "suspended" && <button type="button" disabled={busy} onClick={() => changeStatus(dealer.id, "active")} className={button.small}>{busy ? "Saving…" : "Reactivate"}</button>}
                                                {canViewAs && dealer.status !== "pending" && <Link href={viewAsHref(dealer.id)} aria-label={`Open ${dealer.name} dashboard`} title="Open dealer dashboard" className={button.small}><Icon name="eye" size={13} />View</Link>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {visible.length === 0 && <p className="m-0 px-5 py-10 text-center text-sm text-[#6b6862]">No dealers match.</p>}
                </div>
            </Card>

            {canCompare && selected.length > 0 && (
                <div className="sticky bottom-4 z-20 mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
                    <span><strong>{selected.length}</strong> of {MAX_COMPARE} selected{selected.length < 2 ? " · pick at least 2" : ""}</span>
                    <button type="button" onClick={() => setSelected([])} className="cursor-pointer border-0 bg-transparent p-0 text-sm text-white/70 underline">Clear</button>
                    {selected.length >= 2
                        ? <Link href={`${base}/compare?ids=${selected.join(",")}`} className={button.gold}><Icon name="compare" size={16} />Compare</Link>
                        : <span className={`${button.gold} pointer-events-none opacity-40`}><Icon name="compare" size={16} />Compare</span>}
                </div>
            )}
        </>
    )
}
