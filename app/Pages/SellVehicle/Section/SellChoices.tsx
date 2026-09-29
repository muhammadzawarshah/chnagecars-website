type SellChoicesProps = {
    options: string[]
    value: string
    stacked?: boolean
    onChange: (value: string) => void
}

export default function SellChoices({ options, value, stacked = false, onChange }: SellChoicesProps) {
    return (
        <>
            <div className={`flex ${stacked ? "flex-col items-start gap-5 min-[981px]:gap-3" : "flex-wrap gap-x-1.5 gap-y-5 min-[981px]:gap-x-2.5 min-[981px]:gap-y-3"}`}>
                {options.map((option) => {
                    const selected = value === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`flex h-8.5 max-w-full cursor-pointer items-center gap-2 truncate rounded-lg border px-4.5 text-[11.3px] font-medium min-[981px]:h-11 min-[981px]:px-6 min-[981px]:text-[15px] ${selected ? "border-gold bg-gold text-white" : "border-[#e0e0e0] bg-[#fafafa] text-[#222]"}`}
                        >
                            {selected && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0">
                                    <path d="M1 4l3 3 5-6" />
                                </svg>
                            )}
                            <span className="truncate">{option}</span>
                        </button>
                    )
                })}
            </div>
        </>
    )
}
