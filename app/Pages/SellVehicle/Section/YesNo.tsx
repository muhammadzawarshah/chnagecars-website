type YesNoProps = {
    label: string
    value: string
    error?: string
    onChange: (value: string) => void
}

export default function YesNo({ label, value, error, onChange }: YesNoProps) {
    return (
        <>
            <div className="mt-4">
                <h6 className="mt-0 mb-2 text-base font-bold text-[#212529]">{label}*</h6>
                <div className="flex gap-6">
                    {["Yes", "No"].map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-2 text-[15px] text-[#212529]">
                            <input type="radio" checked={value === option} onChange={() => onChange(option)} className="size-4.5 cursor-pointer accent-gold" />
                            {option}
                        </label>
                    ))}
                </div>
                {error && <p className="mt-1 mb-0 text-xs text-[#dc3545]">{error}</p>}
            </div>
        </>
    )
}
