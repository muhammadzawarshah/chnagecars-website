type ExpandLinkProps = {
    label: string
    open: boolean
    textClass?: string
    onToggle: () => void
}

export default function ExpandLink({ label, open, textClass = "text-[16.6px]", onToggle }: ExpandLinkProps) {
    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`ml-auto flex h-full cursor-pointer items-center border-0 bg-transparent pr-[25px] pl-3 ${textClass} ${open ? "text-[#957e4e]" : "text-black"}`}
            >
                {label}
                {open ? (
                    <svg width="9.33" height="5.33" viewBox="0 0 14 8" fill="none" stroke="#957e4e" strokeWidth="1.8" className="ml-1.5">
                        <path d="M1 1l6 6 6-6" />
                    </svg>
                ) : (
                    <svg width="5.33" height="9.33" viewBox="0 0 8 14" fill="none" stroke="#000" strokeWidth="1.8" className="ml-2">
                        <path d="M1 1l6 6-6 6" />
                    </svg>
                )}
            </button>
        </>
    )
}
