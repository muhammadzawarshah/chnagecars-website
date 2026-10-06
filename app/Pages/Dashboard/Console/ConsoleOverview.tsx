import Link from "next/link"
import { Activity, DealerSummary, PlatformOverview } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import StatCard from "../ui/StatCard"
import PageHeader from "../ui/PageHeader"
import BarChart from "../ui/BarChart"
import StatusBadge from "../ui/StatusBadge"
import { button, formatCompactRand, formatDate, formatDateTime, formatNumber, formatPercent, lastChange, table } from "../ui/format"

type ConsoleOverviewProps = {
    title: string
    overview: PlatformOverview
    dealers: DealerSummary[]
    activity: Activity[]
    base: string
    canViewAs: boolean
    canCompare: boolean
}

export default function ConsoleOverview({ title, overview, dealers, activity, base, canViewAs, canCompare }: ConsoleOverviewProps) {

    const topDealers = dealers.filter((dealer) => dealer.status === "active").sort((a, b) => b.stats.leads - a.stats.leads).slice(0, 5);
    const pending = dealers.filter((dealer) => dealer.status === "pending");

    return (
        <>
            <PageHeader
                title={title}
                subtitle="Platform performance · September 2026 (last full month)"
                actions={<>
                    <Link href={`${base}/dealers`} className={button.outline}>Manage dealers</Link>
                    {canCompare && <Link href={`${base}/compare?ids=${topDealers.slice(0, 3).map((dealer) => dealer.id).join(",")}`} className={button.gold}>Compare top dealers</Link>}
                </>}
            />

            <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[480px]:grid-cols-1">
                <StatCard label="Active dealers" value={formatNumber(overview.activeDealers)} icon="dealers" hint={`${overview.pendingDealers} waiting for approval · ${overview.dealers} total`} />
                <StatCard label="Active listings" value={formatNumber(overview.activeListings)} icon="listings" hint={`Stock value ${formatCompactRand(overview.stockValue)}`} />
                <StatCard label="Leads last month" value={formatNumber(overview.leads)} icon="leads" change={lastChange(overview.monthlyLeads)} />
                <StatCard label="Sold last month" value={formatNumber(overview.soldThisMonth)} icon="check" change={lastChange(overview.monthlySold)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
                <Card title="Leads per month · all dealers"><BarChart data={overview.monthlyLeads} unit="leads" /></Card>
                <Card title="Vehicles sold per month · all dealers"><BarChart data={overview.monthlySold} unit="sold" /></Card>
            </div>

            <div className="mt-4 grid grid-cols-[3fr_2fr] items-start gap-4 max-[1100px]:grid-cols-1">
                <Card title="Top dealers last month" action={<Link href={`${base}/dealers`} className="text-sm font-bold text-gold">All dealers</Link>}>
                    <div className={table.wrap}>
                        <table className={table.table}>
                            <thead><tr><th className={table.head}>Dealer</th><th className={table.head}>Leads</th><th className={table.head}>Sold</th><th className={table.head}>Lead to sale</th><th className={table.head}>Listings</th></tr></thead>
                            <tbody>
                                {topDealers.map((dealer, index) => (
                                    <tr key={dealer.id} className={table.row}>
                                        <td className={table.cell}>
                                            <div className="flex items-center gap-3">
                                                <span className="w-4 text-xs font-bold text-[#8a857b]">{index + 1}</span>
                                                {canViewAs ? <Link href={`${base}/dealers/${dealer.id}`} className="font-bold text-ink no-underline hover:text-gold">{dealer.name}</Link> : <span className="font-bold">{dealer.name}</span>}
                                            </div>
                                        </td>
                                        <td className={`${table.cell} tabular-nums`}>{formatNumber(dealer.stats.leads)}</td>
                                        <td className={`${table.cell} tabular-nums`}>{dealer.stats.soldThisMonth}</td>
                                        <td className={`${table.cell} tabular-nums`}>{formatPercent(dealer.stats.conversionRate)}</td>
                                        <td className={`${table.cell} tabular-nums`}>{dealer.stats.activeListings}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="flex flex-col gap-4">
                    <Card title="Waiting for approval" action={<Link href={`${base}/dealers`} className="text-sm font-bold text-gold">Review</Link>}>
                        {pending.length === 0 && <p className="m-0 text-sm text-[#6b6862]">No applications waiting.</p>}
                        <ul className="m-0 list-none p-0">
                            {pending.map((dealer) => (
                                <li key={dealer.id} className="flex items-center justify-between gap-3 border-b border-[#f2f0ec] py-2.5 last:border-0">
                                    <div className="min-w-0">
                                        <p className="m-0 truncate text-sm font-bold">{dealer.name}</p>
                                        <p className="m-0 text-xs text-[#6b6862]">{dealer.city} · applied {formatDate(dealer.joinedAt)}</p>
                                    </div>
                                    <StatusBadge status={dealer.status} />
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card title="Recent activity">
                        <ul className="m-0 list-none p-0">
                            {activity.map((item) => (
                                <li key={item.id} className="border-b border-[#f2f0ec] py-2.5 text-sm last:border-0">
                                    <p className="m-0"><strong>{item.actor}</strong> {item.action} <strong>{item.target}</strong></p>
                                    <p className="m-0 mt-0.5 text-xs text-[#6b6862]">{formatDateTime(item.at)}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </>
    )
}
