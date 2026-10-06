"use client"

import { useState } from "react"
import { InventoryItem, ListingStatus } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import StatusBadge from "../ui/StatusBadge"
import FilterTabs from "../ui/FilterTabs"
import { formatDate, formatNumber, formatRand, input, table } from "../ui/format"

type Filter = "all" | ListingStatus

const filters: { value: Filter, label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "sold", label: "Sold" },
    { value: "draft", label: "Draft" },
    { value: "flagged", label: "Flagged" },
];

// Listing table with status tabs and a title search. `dealerNames` adds a dealer column (admin view).
export default function DealerInventory({ items, dealerNames }: { items: InventoryItem[], dealerNames?: Record<string, string> }) {

    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();
    const visible = items
        .filter((item) => filter === "all" || item.status === filter)
        .filter((item) => !q || item.title.toLowerCase().includes(q) || dealerNames?.[item.dealerId]?.toLowerCase().includes(q))
        .sort((a, b) => b.listedAt.localeCompare(a.listedAt));

    return (
        <>
            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <FilterTabs value={filter} onChange={setFilter} options={filters.map((option) => ({ ...option, count: option.value === "all" ? items.length : items.filter((item) => item.status === option.value).length }))} />
                    <label className="relative max-[600px]:w-full">
                        <span className="sr-only">Search listings</span>
                        <Icon name="search" size={16} className="pointer-events-none absolute top-2.75 left-3 text-[#8a857b]" />
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={dealerNames ? "Search vehicle or dealer" : "Search vehicles"} className={`${input} w-64 pl-9 max-[600px]:w-full`} />
                    </label>
                </div>
                <div className={table.wrap}>
                    <table className={`${table.table} min-w-180`}>
                        <thead>
                            <tr>
                                <th className={table.head}>Vehicle</th>
                                {dealerNames && <th className={table.head}>Dealer</th>}
                                <th className={table.head}>Price</th>
                                <th className={table.head}>Mileage</th>
                                <th className={table.head}>Status</th>
                                <th className={table.head}>Views</th>
                                <th className={table.head}>Leads</th>
                                <th className={table.head}>Listed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((item) => (
                                <tr key={item.id} className={table.row}>
                                    <td className={table.cell}>
                                        <div className="flex items-center gap-3">
                                            <img src={item.image} alt="" className="h-10 w-15 shrink-0 rounded-md object-cover" />
                                            <span className="line-clamp-2 max-w-70 font-bold">{item.title}</span>
                                        </div>
                                    </td>
                                    {dealerNames && <td className={`${table.cell} whitespace-nowrap`}>{dealerNames[item.dealerId]}</td>}
                                    <td className={`${table.cell} whitespace-nowrap tabular-nums`}>{formatRand(item.price, " ")}</td>
                                    <td className={`${table.cell} whitespace-nowrap tabular-nums`}>{formatNumber(item.mileage)} km</td>
                                    <td className={table.cell}><StatusBadge status={item.status} /></td>
                                    <td className={`${table.cell} tabular-nums`}>{formatNumber(item.views)}</td>
                                    <td className={`${table.cell} tabular-nums`}>{item.leads}</td>
                                    <td className={`${table.cell} whitespace-nowrap`}>{formatDate(item.listedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visible.length === 0 && <p className="m-0 px-5 py-10 text-center text-sm text-[#6b6862]">No listings match.</p>}
                </div>
            </Card>
        </>
    )
}
