import Icon, { IconName } from "./Icon"

type StatCardProps = {
    label: string
    value: string
    icon: IconName
    change?: number
    hint?: string
}

// A headline number. `change` is the % move versus last month; good/bad colour always comes with an arrow and text.
export default function StatCard({ label, value, icon, change, hint }: StatCardProps) {

    const up = (change ?? 0) >= 0;

    return (
        <div className="flex min-w-0 flex-col rounded-xl border border-[#ebe8e1] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.04)] max-[600px]:p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-sm font-bold text-[#6b6862]">{label}</p>
                <span className="flex size-9 items-center justify-center rounded-lg bg-gold/10 text-gold"><Icon name={icon} /></span>
            </div>
            <p className="mt-2 mb-0 truncate text-[28px] leading-9 font-black text-ink max-[600px]:text-2xl">{value}</p>
            {change !== undefined && (
                <p className={`mt-1 mb-0 flex items-center gap-1 text-xs font-bold ${up ? "text-[#1f7a4a]" : "text-[#b42318]"}`}>
                    <Icon name={up ? "up" : "down"} size={13} />
                    {up ? "+" : ""}{Math.round(change * 100)}% <span className="font-normal text-[#6b6862]">vs previous month</span>
                </p>
            )}
            {hint && <p className="mt-1 mb-0 text-xs text-[#6b6862]">{hint}</p>}
        </div>
    )
}
