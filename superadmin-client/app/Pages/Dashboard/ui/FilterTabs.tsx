type FilterTabsProps<T extends string> = {
    options: { value: T, label: string, count: number }[]
    value: T
    onChange: (value: T) => void
}

export default function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
    return (
        <div role="tablist" className="flex flex-wrap gap-1.5">
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={`flex h-8.5 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition ${active ? "border-ink bg-ink text-white" : "border-[#e3dfd6] bg-white text-[#4a4741] hover:border-gold"}`}
                    >
                        {option.label}
                        <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/15" : "bg-[#f0eeea]"}`}>{option.count}</span>
                    </button>
                );
            })}
        </div>
    )
}
