"use client"

import { useState } from "react"
import { MonthlyPoint } from "@/app/lib/dashboard/types"
import { formatNumber } from "./format"

type BarChartProps = {
    data: MonthlyPoint[]
    unit: string
    color?: string
    height?: number
}

function niceMax(value: number) {
    if (value <= 0) return 4;
    const step = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / step) * step;
}

// Single-series monthly bars: gold marks, recessive grid, value on hover and on the latest month.
export default function BarChart({ data, unit, color = "#957e4d", height = 200 }: BarChartProps) {

    const [active, setActive] = useState<number | null>(null);
    const max = niceMax(Math.max(...data.map((point) => point.value)));
    const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];

    return (
        <>
            <div className="flex gap-2 text-xs text-[#6b6862]">
                <div className="flex flex-col justify-between pb-6 text-right tabular-nums" style={{ height }}>
                    {ticks.map((tick) => <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">{formatNumber(tick)}</span>)}
                </div>
                <div className="relative min-w-0 flex-1">
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }}>
                        {ticks.map((tick) => <span key={tick} className={`block h-px ${tick === 0 ? "bg-[#cfc9bd]" : "bg-[#f0ede7]"}`}></span>)}
                    </div>
                    <div className="relative flex items-end gap-[6%] px-[3%]" style={{ height: height - 24 }}>
                        {data.map((point, index) => {
                            const last = index === data.length - 1;
                            const show = active === index || (active === null && last);
                            return (
                                <button
                                    key={point.month}
                                    type="button"
                                    onMouseEnter={() => setActive(index)}
                                    onMouseLeave={() => setActive(null)}
                                    onFocus={() => setActive(index)}
                                    onBlur={() => setActive(null)}
                                    aria-label={`${point.month}: ${formatNumber(point.value)} ${unit}`}
                                    className="relative flex h-full flex-1 cursor-default items-end border-0 bg-transparent p-0"
                                >
                                    <span className="block w-full rounded-t-[4px] transition-opacity" style={{ height: `${(point.value / max) * 100}%`, backgroundColor: color, opacity: active === null || active === index ? 1 : 0.45 }}></span>
                                    {show && (
                                        <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs font-bold whitespace-nowrap text-white tabular-nums" style={{ bottom: `calc(${(point.value / max) * 100}% + 6px)` }}>
                                            {formatNumber(point.value)}{active === index ? ` ${unit}` : ""}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-[6%] px-[3%] pt-2">
                        {data.map((point) => <span key={point.month} className="flex-1 text-center">{point.month}</span>)}
                    </div>
                </div>
            </div>
        </>
    )
}
