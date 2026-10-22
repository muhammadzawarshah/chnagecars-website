"use client"

import { useState } from "react"
import { formatNumber } from "./format"

export type LineSeries = {
    name: string
    color: string
    values: number[]
}

type LineChartProps = {
    labels: string[]
    series: LineSeries[]
    unit: string
    height?: number
}

function niceMax(value: number) {
    if (value <= 0) return 4;
    const step = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / step) * step;
}

// Monthly trend lines on one shared axis. Hover anywhere for a crosshair with every series' value.
// Two or more series get a legend; one series is named by the card title.
export default function LineChart({ labels, series, unit, height = 220 }: LineChartProps) {

    const [active, setActive] = useState<number | null>(null);
    const max = niceMax(Math.max(...series.flatMap((line) => line.values)));
    const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];
    const plot = height - 24;
    const x = (index: number) => (labels.length === 1 ? 50 : 4 + (index / (labels.length - 1)) * 92);
    const y = (value: number) => 100 - (value / max) * 100;

    return (
        <>
            {series.length > 1 && (
                <ul className="m-0 mb-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-[#4a4741]">
                    {series.map((line) => (
                        <li key={line.name} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: line.color }}></span>{line.name}</li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2 text-xs text-[#6b6862]">
                <div className="flex flex-col justify-between pb-6 text-right tabular-nums" style={{ height }}>
                    {ticks.map((tick) => <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">{formatNumber(tick)}</span>)}
                </div>
                <div className="relative min-w-0 flex-1">
                    <div className="relative" style={{ height: plot }}>
                        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                            {ticks.map((tick) => <span key={tick} className={`block h-px ${tick === 0 ? "bg-[#cfc9bd]" : "bg-[#f0ede7]"}`}></span>)}
                        </div>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                            {active !== null && <line x1={x(active)} x2={x(active)} y1="0" y2="100" stroke="#cfc9bd" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
                            {series.map((line) => (
                                <polyline key={line.name} points={line.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                            ))}
                        </svg>
                        {series.map((line) => line.values.map((value, index) => (active === index || (active === null && index === labels.length - 1)) && (
                            <span key={`${line.name}-${index}`} className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${x(index)}%`, top: `${y(value)}%`, backgroundColor: line.color }}></span>
                        )))}
                        <div className="absolute inset-0 flex">
                            {labels.map((label, index) => (
                                <button
                                    key={label}
                                    type="button"
                                    aria-label={`${label}: ${series.map((line) => `${line.name} ${formatNumber(line.values[index])}`).join(", ")}`}
                                    onMouseEnter={() => setActive(index)}
                                    onMouseLeave={() => setActive(null)}
                                    onFocus={() => setActive(index)}
                                    onBlur={() => setActive(null)}
                                    className="h-full flex-1 cursor-default border-0 bg-transparent p-0"
                                ></button>
                            ))}
                        </div>
                        {active !== null && (
                            <div className={`pointer-events-none absolute top-0 z-10 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg ${x(active) > 60 ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5"}`} style={{ left: `${x(active)}%` }}>
                                <p className="m-0 mb-1 font-bold">{labels[active]}</p>
                                {series.map((line) => (
                                    <p key={line.name} className="m-0 flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                                        <span className="size-2 rounded-full" style={{ backgroundColor: line.color }}></span>
                                        {series.length > 1 && <span className="text-white/75">{line.name}</span>}
                                        <strong>{formatNumber(line.values[active])}</strong> {unit}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative h-6 pt-2">
                        {labels.map((label, index) => <span key={label} className="absolute -translate-x-1/2" style={{ left: `${x(index)}%` }}>{label}</span>)}
                    </div>
                </div>
            </div>
        </>
    )
}
