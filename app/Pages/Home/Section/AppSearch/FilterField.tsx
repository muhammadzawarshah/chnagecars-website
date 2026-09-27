type FilterFieldProps = {
    label: string
    active: boolean
    wide?: boolean
    onClick: () => void
}

export default function FilterField({ label, active, wide = false, onClick }: FilterFieldProps) {
    return (
        <>
            <button
                onClick={onClick}
                className={`relative flex h-[38.6px] w-full cursor-pointer items-center overflow-hidden rounded-[5px] border border-[#e8e8e8] bg-white text-left text-[12.4px] whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${wide ? "col-span-2 pr-10 pl-[16.9px]" : "pr-9 pl-[14.8px]"} ${active ? "text-[#333]" : "text-[#8c8c8c]"}`}
            >
                <span className="truncate">{label}</span>
                <svg width="8.5" height="5" viewBox="0 0 10 6" fill="none" stroke="#8c8c8c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={`absolute top-1/2 -translate-y-1/2 ${wide ? "right-[21px]" : "right-[19.6px]"}`}>
                    <path d="M1 1l4 4 4-4" />
                </svg>
            </button>
        </>
    )
}
