type AppFieldProps = {
    label: string
    wide?: boolean
    open?: boolean
    className?: string
    onClick: () => void
}

export default function AppField({ label, wide = false, open = false, className = "", onClick }: AppFieldProps) {
    return (
        <>
            <button
                onClick={onClick}
                className={`relative flex h-10 w-full cursor-pointer items-center overflow-hidden rounded border border-white bg-transparent text-left text-[13.85px] whitespace-nowrap text-white ${wide ? "pr-11 pl-3.75" : "pr-10 pl-3.25"} ${className}`}
            >
                <span className="truncate">{label}</span>
                {wide ? (
                    <svg width="11.33" height="7.33" viewBox="0 0 16 10" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={`absolute top-1/2 right-[19.33px] -translate-y-1/2 ${open ? "rotate-180" : ""}`}>
                        <path d="M2 2l6 6 6-6" />
                    </svg>
                ) : (
                    <svg width="10" height="6.67" viewBox="0 0 14 9" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={`absolute top-1/2 right-4.25 -translate-y-1/2 ${open ? "rotate-180" : ""}`}>
                        <path d="M1.8 1.8l5.2 5.2 5.2-5.2" />
                    </svg>
                )}
            </button>
        </>
    )
}
