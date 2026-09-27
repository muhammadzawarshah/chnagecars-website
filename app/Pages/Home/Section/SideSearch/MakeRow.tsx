type MakeRowProps = {
    label: string
    count?: number
    selected: boolean
    indent: string
    toggleLabel?: string
    open?: boolean
    onSelect: () => void
    onToggle?: () => void
}

export default function MakeRow({ label, count, selected, indent, toggleLabel, open = false, onSelect, onToggle }: MakeRowProps) {
    return (
        <>
            <div onClick={onSelect} className={`flex h-7.5 cursor-pointer items-center rounded pr-2.5 text-[13px] ${indent} ${selected ? "bg-[#eee8dc] font-semibold text-[#957e4d]" : "text-[#171717] hover:bg-[#f5f2ed]"}`}>
                <span className="truncate">{label}</span>
                {count !== undefined && <span className="ml-1.5 shrink-0 font-normal text-[#8c8c8c]">({count})</span>}
                <span className="ml-auto flex shrink-0 items-center gap-2.5 pl-2">
                    {onToggle && (
                        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal ${open ? "text-[#957e4d]" : "text-[#777] hover:text-[#957e4d]"}`}>
                            {toggleLabel}
                            <svg width="6" height="9" viewBox="0 0 8 12" fill="none" stroke="currentColor" strokeWidth="1.6" className={open ? "rotate-90" : ""}>
                                <path d="M1.5 1l5 5-5 5" />
                            </svg>
                        </button>
                    )}
                    {selected && <svg width="13" height="10" viewBox="0 0 18 14" fill="none" stroke="#9d885c" strokeWidth="2"><path d="M1 7l5 5L17 1" /></svg>}
                </span>
            </div>
        </>
    )
}
