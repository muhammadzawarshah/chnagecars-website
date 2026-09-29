type FormFieldProps = {
    placeholder: string
    value: string
    error?: string
    type?: string
    options?: string[]
    disabled?: boolean
    onChange: (value: string) => void
}

export default function FormField({ placeholder, value, error, type = "text", options, disabled = false, onChange }: FormFieldProps) {

    const field = `h-13 w-full rounded border bg-white px-2.5 text-[17px] outline-none placeholder:text-[#999] focus:border-gold disabled:cursor-not-allowed disabled:bg-white disabled:text-[#ccc] ${error ? "border-[#f5a5a5]" : "border-[#ddd]"}`;

    return (
        <>
            <div className="min-w-0">
                {options ? (
                    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${field} cursor-pointer appearance-none bg-[url(/img/sell/chevron.svg)] bg-size-[14px] bg-position-[right_12px_center] bg-no-repeat pr-9 ${value ? "text-[#212529]" : "text-[#999]"}`}>
                        <option value="">{placeholder}</option>
                        {options.map((option) => (
                            <option key={option} value={option} className="text-[#212529]">{option}</option>
                        ))}
                    </select>
                ) : (
                    <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${field} text-[#212529]`} />
                )}
                {error && <p className="mt-1 mb-0 text-xs text-[#dc3545]">{error}</p>}
            </div>
        </>
    )
}
