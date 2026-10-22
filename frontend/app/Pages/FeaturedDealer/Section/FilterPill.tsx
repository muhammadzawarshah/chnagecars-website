"use client"

type FilterPillProps = {
    prefix: string
    label: string
    heading: string
    options: { value: string, label: string }[]
    value: string
    open: boolean
    onToggle: () => void
    onSelect: (value: string) => void
    className?: string
}

// Dark rounded "Filter by: Make" pill with the white dropdown list the live page uses.
export default function FilterPill({ prefix, label, heading, options, value, open, onToggle, onSelect, className = "" }: FilterPillProps) {
    return (
        <>
            <div data-filter-pill className={`relative ${className}`}>
                <button type="button" onClick={onToggle} aria-expanded={open} className="mb-1.25 block cursor-default rounded-full border-0 bg-[#2d2c2c] p-3.75 text-left font-sans text-sm leading-[16.1px] font-medium text-white">
                    {prefix} <span className="cursor-pointer text-gold underline">{label}</span>
                </button>
                {open && (
                    <div className="absolute top-full right-0 z-10 rounded-sm border border-[#7c7c7c] bg-white font-sans">
                        <span className="block h-9.25 border-b border-[#7c7c7c] px-2.75 text-sm leading-9 font-medium text-[#a39161]">{heading}</span>
                        <ul className="my-2.5 max-h-70 w-50 list-none overflow-auto p-0">
                            {options.map((option) => (
                                <li key={option.value || "all"} className={`h-6.5 leading-6.5 hover:bg-[rgba(111,111,111,0.5)] ${option.value === value ? "bg-[rgba(111,111,111,0.3)]" : ""}`}>
                                    <button type="button" onClick={() => onSelect(option.value)} className="block h-6.5 w-full cursor-pointer border-0 bg-transparent py-0 pr-7.5 pl-2.75 text-left font-sans text-sm leading-6.5 whitespace-nowrap text-[#a39161] transition duration-500">{option.label}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
