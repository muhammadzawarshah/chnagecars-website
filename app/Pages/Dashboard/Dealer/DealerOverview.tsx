import Link from "next/link"
import { DealerSummary, InventoryItem, Lead } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import StatCard from "../ui/StatCard"
import StatusBadge from "../ui/StatusBadge"
import PageHeader from "../ui/PageHeader"
import BarChart from "../ui/BarChart"
import LineChart from "../ui/LineChart"
import { button, formatCompactRand, formatDateTime, formatNumber, formatPercent, formatRand, lastChange, table } from "../ui/format"

type DealerOverviewProps = {
    dealer: DealerSummary
    inventory: InventoryItem[]
    leads: Lead[]
    basePath: string
}

export default function DealerOverview({ dealer, inventory, leads, basePath }: DealerOverviewProps) {

    const { stats } = dealer;
    const topListings = inventory.filter((item) => item.status === "active").sort((a, b) => b.views - a.views).slice(0, 5);

    return (
        <>
            <PageHeader
                title={dealer.name}
                subtitle={<>{dealer.city}, {dealer.province} · {dealer.plan} plan · Rated {dealer.rating ? dealer.rating.toFixed(1) : "—"} <StatusBadge status={dealer.status} /></>}
                actions={<Link href={`${basePath}/inventory`} className={button.gold}>Manage inventory</Link>}
            />

            <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[480px]:grid-cols-1">
                <StatCard label="Active listings" value={formatNumber(stats.activeListings)} icon="listings" hint={`Stock value ${formatCompactRand(stats.stockValue)}`} />
                <StatCard label="Leads last month" value={formatNumber(stats.leads)} icon="leads" change={lastChange(stats.monthlyLeads)} />
                <StatCard label="Views last month" value={formatNumber(stats.views)} icon="eye" change={lastChange(stats.monthlyViews)} />
                <StatCard label="Lead to sale" value={formatPercent(stats.conversionRate)} icon="check" hint={`${stats.soldThisMonth} sold · ${stats.avgDaysToSell} days avg to sell`} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
                <Card title="Leads per month">
                    <BarChart data={stats.monthlyLeads} unit="leads" />
                </Card>
                <Card title="Listing views per month">
                    <LineChart labels={stats.monthlyViews.map((point) => point.month)} series={[{ name: "Views", color: "#957e4d", values: stats.monthlyViews.map((point) => point.value) }]} unit="views" />
                </Card>
            </div>

            <div className="mt-4 grid grid-cols-[3fr_2fr] items-start gap-4 max-[1100px]:grid-cols-1">
                <Card title="Top listings by views" action={<Link href={`${basePath}/inventory`} className="text-sm font-bold text-gold">View all</Link>}>
                    <div className={table.wrap}>
                        <table className={table.table}>
                            <thead><tr><th className={table.head}>Vehicle</th><th className={table.head}>Price</th><th className={table.head}>Views</th><th className={table.head}>Leads</th></tr></thead>
                            <tbody>
                                {topListings.map((item) => (
                                    <tr key={item.id} className={table.row}>
                                        <td className={table.cell}>
                                            <div className="flex items-center gap-3">
                                                <img src={item.image} alt="" className="h-10 w-15 shrink-0 rounded-md object-cover" />
                                                <span className="line-clamp-1 font-bold">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className={`${table.cell} whitespace-nowrap tabular-nums`}>{formatRand(item.price, " ")}</td>
                                        <td className={`${table.cell} tabular-nums`}>{formatNumber(item.views)}</td>
                                        <td className={`${table.cell} tabular-nums`}>{item.leads}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Latest leads" action={<Link href={`${basePath}/leads`} className="text-sm font-bold text-gold">View all</Link>}>
                    <ul className="m-0 list-none p-0">
                        {leads.slice(0, 6).map((lead) => (
                            <li key={lead.id} className="flex items-center gap-3 border-b border-[#f2f0ec] py-2.5 last:border-0">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3efe6] text-xs font-bold text-gold">{lead.customer.split(" ").map((part) => part[0]).join("")}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="m-0 truncate text-sm font-bold">{lead.customer}</p>
                                    <p className="m-0 truncate text-xs text-[#6b6862]">{lead.vehicle} · {lead.source}</p>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={lead.status} />
                                    <p className="m-0 mt-1 text-[11px] text-[#6b6862]">{formatDateTime(lead.createdAt)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </>
    )
}
