import { ReactNode } from "react"

export type ToggleOption<T extends string> = {
    value: T
    label: string
    icon?: ReactNode
}

type SegmentedToggleProps<T extends string> = {
    label: string
    options: [ToggleOption<T>, ToggleOption<T>]
    value: T
    onChange: (value: T) => void
    className?: string
}

export default function SegmentedToggle<T extends string>({ label, options, value, onChange, className = "" }: SegmentedToggleProps<T>) {

    const second = value === options[1].value;

    return (
        <div role="radiogroup" aria-label={label} className={`relative grid w-full max-w-80 grid-cols-2 rounded-full border border-gold/25 bg-white p-1 shadow-[0_3px_10px_rgba(149,126,77,0.15)] ${className}`}>
            <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-linear-to-r from-[#a58d5a] to-gold shadow-[0_2px_6px_rgba(149,126,77,0.45)] transition-transform duration-300 ease-out ${second ? "translate-x-full" : "translate-x-0"}`}
            ></span>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(option.value)}
                        className={`relative z-1 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[13px] font-bold whitespace-nowrap transition-colors duration-300 ${active ? "text-white" : "text-gold hover:text-[#6f5d38]"}`}
                    >
                        {option.icon}
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
