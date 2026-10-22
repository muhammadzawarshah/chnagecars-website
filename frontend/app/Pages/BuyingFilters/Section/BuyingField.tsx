type BuyingFieldProps = {
    label: string
    active: boolean
    wide?: boolean
    onClick: () => void
}

export default function BuyingField({ label, active, wide = false, onClick }: BuyingFieldProps) {
    return (
        <>
            <button
                onClick={onClick}
                className={`relative flex h-10 w-full cursor-pointer items-center overflow-hidden rounded-[5px] border border-[#ececec] bg-white pr-10 text-left text-[14.5px] whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${wide ? "col-span-2 pl-4" : "pl-3.5"} ${active ? "text-[#333]" : "text-[#9a9a9a]"}`}
            >
                <span className="truncate">{label}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="#a8a6a6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="absolute top-1/2 right-5 -translate-y-1/2">
                    <path d="M1 1l4 4 4-4" />
                </svg>
            </button>
        </>
    )
}
