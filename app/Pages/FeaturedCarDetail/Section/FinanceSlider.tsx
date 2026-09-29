type FinanceSliderProps = {
    label: string
    display: string
    min: number
    max: number
    step: number
    value: number
    minLabel: string
    maxLabel: string
    onChange: (value: number) => void
}

export default function FinanceSlider({ label, display, min, max, step, value, minLabel, maxLabel, onChange }: FinanceSliderProps) {
    return (
        <>
            <div className="mt-5">
                <div className="flex items-center justify-between">
                    <span className="text-[15px] text-[#222] min-[981px]:text-lg">{label}</span>
                    <span className="text-[13px] text-gold min-[981px]:text-base">{display}</span>
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="mt-3 h-1 w-full cursor-pointer accent-gold"
                />
                <div className="mt-1.5 flex justify-between text-xs text-[#9e9e9e] min-[981px]:text-sm">
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                </div>
            </div>
        </>
    )
}
