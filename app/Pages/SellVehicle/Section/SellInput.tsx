type SellInputProps = {
    value: string
    placeholder?: string
    type?: string
    options?: string[]
    disabled?: boolean
    error?: boolean
    onChange: (value: string) => void
}

export default function SellInput({ value, placeholder = "", type = "text", options, disabled = false, error = false, onChange }: SellInputProps) {

    const box = `h-9.5 w-full rounded-md border px-3 text-[11.5px] outline-none focus:border-gold ${error ? "border-[#e53935]" : "border-[#e0e0e0]"}`;

    if (options) {
        return (
            <>
                <div className="relative">
                    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${box} cursor-pointer appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-[#eeeeee] ${disabled ? "" : "bg-[#fafafa]"} ${value ? "text-[#222]" : "text-[#9e9e9e]"}`}>
                        <option value="">{placeholder}</option>
                        {options.map((option) => (
                            <option key={option} value={option} className="text-[#222]">{option}</option>
                        ))}
                    </select>
                    <svg width="10" height="5" viewBox="0 0 10 5" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                        <path d="M0 0h10L5 5z" fill={disabled ? "#bdbdbd" : "#616161"} />
                    </svg>
                </div>
            </>
        )
    }

    return (
        <>
            <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${box} bg-[#fafafa] text-[#222] placeholder:text-[#9e9e9e]`} />
        </>
    )
}
