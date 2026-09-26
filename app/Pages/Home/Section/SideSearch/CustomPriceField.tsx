type CustomPriceFieldProps = {
    label: string
    value: string
    active: boolean
    onChange: (value: string) => void
    onFocus: () => void
    onBlur: () => void
}

export default function CustomPriceField({ label, value, active, onChange, onFocus, onBlur }: CustomPriceFieldProps) {
    return (
        <>
            <div className="relative w-[calc(50%-20px)]">
                <label className={`pointer-events-none absolute font-extralight text-ink transition-all duration-300 ${active ? "bottom-10 text-[12px]" : "bottom-2.5 text-[14px]"}`}>{label}</label>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 R]*"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className="mb-3.25 block h-8.75 w-full cursor-pointer appearance-none rounded-none border-0 border-b border-ink bg-transparent px-3.75 text-sm leading-[1.15] text-ink outline-none placeholder:text-text-dark"
                />
            </div>
        </>
    )
}
