// Status colours are reserved for state and always carry a text label.
const tones = {
    good: "bg-[#e7f5ec] text-[#1f7a4a]",
    warning: "bg-[#fdf3dc] text-[#8a5a00]",
    critical: "bg-[#fdecea] text-[#b42318]",
    info: "bg-[#e8f0fb] text-[#1f5fae]",
    neutral: "bg-[#f0eeea] text-[#5c5850]",
}

const statusTone: Record<string, keyof typeof tones> = {
    active: "good", won: "good", sold: "info",
    pending: "warning", new: "warning", invited: "warning", draft: "neutral",
    suspended: "critical", lost: "critical", flagged: "critical", disabled: "critical",
    contacted: "info",
}

export default function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.75 text-xs font-bold whitespace-nowrap capitalize ${tones[statusTone[status] ?? "neutral"]}`}>
            <span className="size-1.5 rounded-full bg-current"></span>
            {status}
        </span>
    )
}
