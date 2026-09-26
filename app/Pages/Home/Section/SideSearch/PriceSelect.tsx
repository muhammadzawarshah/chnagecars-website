import { PriceOption } from "../../Data/search"

type PriceSelectProps = {
    options: PriceOption[]
    selected: number | null
    onSelect: (value: number | null) => void
}

export default function PriceSelect({ options, selected, onSelect }: PriceSelectProps) {
    return (
        <>
            <div className="absolute z-48 max-h-58.5 w-full overflow-y-auto rounded-b bg-panel">
                <p className="m-0 border-b border-[#c1c1c1] px-3 py-2 text-[11px] leading-3.5 text-text-dark">
                    Estimated repayments are based on a 72 month loan repayment at an interest rate of Prime +2%
                </p>
                <ul className="m-0 list-none p-0">
                    {options.map((option) => (
                        <li
                            key={option.value}
                            onClick={() => onSelect(selected === option.value ? null : option.value)}
                            className={`flex h-8 cursor-pointer items-center justify-between px-3 text-[13px] text-text-dark transition-colors duration-100 hover:bg-muted hover:text-white ${selected === option.value ? "font-bold" : ""}`}
                        >
                            <span>{option.price}</span>
                            <span>{option.monthly}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
