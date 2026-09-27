import { ReactNode } from "react"
import { PriceOption } from "../../Data/search"

type PriceSelectProps = {
    options: PriceOption[]
    selected: number | null
    customOption?: PriceOption | null
    alignRight?: boolean
    onSelect: (value: number, custom: boolean) => void
    children?: ReactNode
}

export default function PriceSelect({ options, selected, customOption = null, alignRight = false, onSelect, children }: PriceSelectProps) {

    const items = customOption ? [customOption, ...options] : options;

    return (
        <>
<<<<<<< HEAD
            <div className={`absolute z-46 w-[calc(200%+10px)] overflow-hidden rounded-b bg-panel p-0 ${alignRight ? "right-0" : ""}`}>
=======
            <div className={`absolute z-46 w-[208.5%] overflow-hidden rounded-b bg-panel p-0 ${alignRight ? "right-0" : ""}`}>
>>>>>>> origin/main
                <div className="group/info relative">
                    <span className="absolute top-1.25 right-5 z-1 block size-5 cursor-pointer bg-[url(/img/info-icon.svg)] bg-contain bg-no-repeat max-[1039px]:size-7.5"></span>
                    <div className="absolute top-8.75 right-1.25 z-5 hidden w-1/2 rounded-[5px] bg-white p-2.5 group-hover/info:block before:absolute before:-top-2 before:right-3.75 before:block before:h-2.5 before:w-5 before:bg-white before:content-[''] before:[clip-path:polygon(0%_100%,50%_0%,100%_100%)] max-[1039px]:top-11.75 max-[1039px]:before:right-5">
                        <p className="m-0 text-[13px]">Estimated repayments are based on a 72 month loan repayment at an interest rate of Prime +2%</p>
                    </div>
                </div>
                {children}
                <ul className="m-0 block max-h-62.5 list-none overflow-y-auto px-0 pt-1.25 pb-0">
                    {items.map((option, index) => {
                        const custom = customOption !== null && index === 0;
                        const isSelected = customOption ? custom : selected === option.value;
                        return (
                            <li
                                key={custom ? "custom" : option.value}
                                onClick={() => onSelect(option.value, custom)}
                                className={`group/row m-0 block h-10.5 cursor-pointer overflow-hidden py-1.25 pr-0 pl-6.25 transition-colors duration-100 hover:bg-muted ${isSelected ? "bg-[#aaa]" : ""}`}
                            >
                                <label className={`float-left h-8 w-full cursor-pointer text-[13px] leading-8 text-text-dark group-hover/row:text-white max-[676px]:text-[15px] ${isSelected ? "font-bold" : ""}`}>
                                    <span className="relative inline-block min-w-1/2 before:absolute before:top-1.5 before:right-5 before:block before:h-5 before:w-px before:bg-black before:content-['']">{option.price}</span>
                                    <span>{option.monthly}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </>
    )
}
