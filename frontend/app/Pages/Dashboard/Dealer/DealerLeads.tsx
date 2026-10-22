"use client"

import { useState } from "react"
import { Lead, LeadStatus } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import StatusBadge from "../ui/StatusBadge"
import FilterTabs from "../ui/FilterTabs"
import { button, formatDateTime, input, table } from "../ui/format"

type Filter = "all" | LeadStatus

const filters: { value: Filter, label: string }[] = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
];

export default function DealerLeads({ leads }: { leads: Lead[] }) {

    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");

    const q = query.trim().toLowerCase();
    const visible = leads
        .filter((lead) => filter === "all" || lead.status === filter)
        .filter((lead) => !q || lead.customer.toLowerCase().includes(q) || lead.vehicle.toLowerCase().includes(q));

    return (
        <>
            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <FilterTabs value={filter} onChange={setFilter} options={filters.map((option) => ({ ...option, count: option.value === "all" ? leads.length : leads.filter((lead) => lead.status === option.value).length }))} />
                    <label className="relative max-[600px]:w-full">
                        <span className="sr-only">Search leads</span>
                        <Icon name="search" size={16} className="pointer-events-none absolute top-2.75 left-3 text-[#8a857b]" />
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or vehicle" className={`${input} w-64 pl-9 max-[600px]:w-full`} />
                    </label>
                </div>
                <div className={table.wrap}>
                    <table className={`${table.table} min-w-180`}>
                        <thead>
                            <tr>
                                <th className={table.head}>Customer</th>
                                <th className={table.head}>Vehicle</th>
                                <th className={table.head}>Source</th>
                                <th className={table.head}>Status</th>
                                <th className={table.head}>Received</th>
                                <th className={table.head}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((lead) => (
                                <tr key={lead.id} className={table.row}>
                                    <td className={table.cell}>
                                        <p className="m-0 font-bold whitespace-nowrap">{lead.customer}</p>
                                        <p className="m-0 text-xs whitespace-nowrap text-[#6b6862] tabular-nums">{lead.phone}</p>
                                    </td>
                                    <td className={table.cell}><span className="line-clamp-2 max-w-70">{lead.vehicle}</span></td>
                                    <td className={`${table.cell} whitespace-nowrap`}>{lead.source}</td>
                                    <td className={table.cell}><StatusBadge status={lead.status} /></td>
                                    <td className={`${table.cell} whitespace-nowrap`}>{formatDateTime(lead.createdAt)}</td>
                                    <td className={`${table.cell} text-right`}>
                                        <div className="flex justify-end gap-1.5">
                                            <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className={button.small}><Icon name="phone" size={13} />Call</a>
                                            <a href={`https://wa.me/27${lead.phone.replace(/\s/g, "").slice(1)}`} target="_blank" rel="noopener" className={button.small}>WhatsApp</a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visible.length === 0 && <p className="m-0 px-5 py-10 text-center text-sm text-[#6b6862]">No leads match.</p>}
                </div>
            </Card>
        </>
    )
}
