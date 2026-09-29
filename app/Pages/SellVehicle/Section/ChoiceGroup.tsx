type ChoiceGroupProps = {
    label: string
    options: string[]
    value: string
    error?: string
    stacked?: boolean
    onChange: (value: string) => void
}

export default function ChoiceGroup({ label, options, value, error, stacked = false, onChange }: ChoiceGroupProps) {
    return (
        <>
            <div className="mt-4">
                <h6 className="mt-0 mb-2 text-base font-bold text-[#212529]">{label}*</h6>
                <div className={`flex gap-2 ${stacked ? "flex-col items-start" : "flex-wrap"}`}>
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(option)}
                            className={`min-h-9.5 cursor-pointer rounded-sm border px-3 py-1.5 text-left text-[15px] transition ${value === option ? "border-gold bg-gold text-white" : "border-[#343a40] bg-[#343a40] text-white hover:bg-[#23272b]"}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {error && <p className="mt-1 mb-0 text-xs text-[#dc3545]">{error}</p>}
            </div>
        </>
    )
}
