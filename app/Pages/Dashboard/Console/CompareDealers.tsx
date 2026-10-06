import Link from "next/link"
import { DealerSummary } from "@/app/lib/dashboard/types"
import Card from "../ui/Card"
import PageHeader from "../ui/PageHeader"
import LineChart from "../ui/LineChart"
import Icon from "../ui/Icon"
import ComparePicker from "./ComparePicker"
import { button, formatCompactRand, formatNumber, formatPercent, table } from "../ui/format"

// Validated categorical order (colour-blind safe for up to 4 adjacent series on white).
// Colour follows the dealer's slot in the URL, so it stays put while you read.
export const compareColors = ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"];

type Metric = {
    label: string
    value: (dealer: DealerSummary) => number
    format: (value: number) => string
    lowerIsBetter?: boolean
}

const metrics: Metric[] = [
    { label: "Leads last month", value: (d) => d.stats.leads, format: formatNumber },
    { label: "Sold last month", value: (d) => d.stats.soldThisMonth, format: formatNumber },
    { label: "Lead to sale", value: (d) => d.stats.conversionRate, format: formatPercent },
    { label: "Active listings", value: (d) => d.stats.activeListings, format: formatNumber },
    { label: "Listing views", value: (d) => d.stats.views, format: formatNumber },
    { label: "Days to sell (avg)", value: (d) => d.stats.avgDaysToSell, format: (v) => `${v} days`, lowerIsBetter: true },
    { label: "Reply time (avg)", value: (d) => d.stats.responseHours, format: (v) => `${v} h`, lowerIsBetter: true },
    { label: "Stock value", value: (d) => d.stats.stockValue, format: formatCompactRand },
    { label: "Rating", value: (d) => d.rating, format: (v) => (v ? v.toFixed(1) : "—") },
];

const chartMetrics = metrics.slice(0, 6);

type CompareDealersProps = {
    selected: DealerSummary[]
    options: DealerSummary[]
    base: string
}

export default function CompareDealers({ selected, options, base }: CompareDealersProps) {

    const colored = selected.map((dealer, index) => ({ dealer, color: compareColors[index] }));
    const best = (metric: Metric) => {
        const values = selected.map(metric.value).filter((value) => value > 0);
        return values.length ? (metric.lowerIsBetter ? Math.min(...values) : Math.max(...values)) : null;
    };

    return (
        <>
            <PageHeader title="Compare dealers" subtitle="September 2026 (last full month) · pick 2 to 4 dealers" actions={<Link href={`${base}/dealers`} className={button.outline}><Icon name="back" size={16} />All dealers</Link>} />

            <Card className="mb-4">
                <ComparePicker base={base} selected={colored.map(({ dealer, color }) => ({ id: dealer.id, name: dealer.name, color }))} options={options.map((dealer) => ({ id: dealer.id, name: dealer.name }))} />
            </Card>

            {selected.length < 2 ? (
                <Card><p className="m-0 py-8 text-center text-sm text-[#6b6862]">Add at least two dealers to compare them.</p></Card>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
                        {chartMetrics.map((metric) => {
                            const max = Math.max(...selected.map(metric.value), 1);
                            const top = best(metric);
                            return (
                                <Card key={metric.label} title={metric.label}>
                                    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                                        {colored.map(({ dealer, color }) => {
                                            const value = metric.value(dealer);
                                            return (
                                                <li key={dealer.id}>
                                                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                                        <span className="truncate text-[#4a4741]">{dealer.name}</span>
                                                        <span className="font-bold whitespace-nowrap text-ink tabular-nums">{metric.format(value)}{value === top && <span className="ml-1.5 rounded bg-gold/15 px-1 text-[10px] text-gold uppercase">Best</span>}</span>
                                                    </div>
                                                    <div className="h-2.5 rounded-full bg-[#f2f0ec]">
                                                        <div className="h-full rounded-full" style={{ width: `${Math.max((value / max) * 100, value ? 2 : 0)}%`, backgroundColor: color }}></div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Card>
                            );
                        })}
                    </div>

                    <Card title="Leads per month" className="mt-4">
                        <LineChart labels={selected[0].stats.monthlyLeads.map((point) => point.month)} unit="leads" series={colored.map(({ dealer, color }) => ({ name: dealer.name, color, values: dealer.stats.monthlyLeads.map((point) => point.value) }))} />
                    </Card>

                    <Card title="Side by side" className="mt-4">
                        <div className={table.wrap}>
                            <table className={table.table}>
                                <thead>
                                    <tr>
                                        <th className={table.head}>Metric</th>
                                        {colored.map(({ dealer, color }) => (
                                            <th key={dealer.id} className={table.head}>
                                                <span className="flex items-center gap-1.5 normal-case"><span className="size-2.5 rounded-full" style={{ backgroundColor: color }}></span>{dealer.name}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[{ label: "Plan", text: (d: DealerSummary) => d.plan }, { label: "Location", text: (d: DealerSummary) => `${d.city}, ${d.province}` }].map((row) => (
                                        <tr key={row.label} className={table.row}>
                                            <td className={`${table.cell} font-bold text-[#6b6862]`}>{row.label}</td>
                                            {selected.map((dealer) => <td key={dealer.id} className={table.cell}>{row.text(dealer)}</td>)}
                                        </tr>
                                    ))}
                                    {metrics.map((metric) => {
                                        const top = best(metric);
                                        return (
                                            <tr key={metric.label} className={table.row}>
                                                <td className={`${table.cell} font-bold whitespace-nowrap text-[#6b6862]`}>{metric.label}{metric.lowerIsBetter && <span className="font-normal"> (lower is better)</span>}</td>
                                                {selected.map((dealer) => {
                                                    const value = metric.value(dealer);
                                                    return <td key={dealer.id} className={`${table.cell} tabular-nums ${value === top ? "font-black text-gold" : ""}`}>{metric.format(value)}{value === top && <span className="sr-only"> (best)</span>}</td>;
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </>
    )
}
