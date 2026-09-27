import { AdditionalFilter } from "../../Data/additionalFilters"

type AdditionalFilterFieldProps = {
    filter: AdditionalFilter
    selected: string[]
    open: boolean
    multiple: boolean
    onToggle: () => void
    onChange: (selected: string[]) => void
}

export default function AdditionalFilterField({ filter, selected, open, multiple, onToggle, onChange }: AdditionalFilterFieldProps) {

    function select(option: string) {
        if (!multiple) {
            onChange(selected.includes(option) ? [] : [option]);
            return;
        }
        onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
    }

    const label = selected.length === 0 ? filter.label : selected.length === 1 ? selected[0] : `${selected[0]} + ${selected.length - 1} More`;
    const options = ["Any", ...filter.options];

    return (
        <>
            <div className="relative w-[calc(50%-10px)] max-[621px]:w-full">
                <div
                    onClick={onToggle}
                    className={`relative h-10 w-full cursor-pointer overflow-hidden border border-[#e8e8e8] bg-white px-3.75 text-sm leading-9.5 font-normal text-ellipsis whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.08)] after:absolute after:top-1/2 after:right-4.25 after:block after:-translate-y-1/2 after:border-x-4 after:border-x-transparent after:content-[''] max-[676px]:text-base ${selected.length ? "text-[#333]" : "text-[#8c8c8c]"} ${open ? "rounded-t-[5px] after:border-b-6 after:border-b-[#8c8c8c]" : "rounded-[5px] after:border-t-6 after:border-t-[#8c8c8c]"}`}
                >
                    {label}
                </div>
                {open && (
                    <div className="absolute z-46 max-h-32.75 w-full overflow-y-scroll rounded-b-[5px] border border-t-0 border-[#e8e8e8] bg-white p-0 shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
                        {filter.info && <p className="mx-0 mt-0 mb-1.5 px-3.5 pt-2 text-[13px] leading-4.25 text-[#8c8c8c]">{filter.info}</p>}
                        <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                            {options.map((option) => {
                                const checked = option === "Any" ? selected.length === 0 : selected.includes(option);
                                return (
                                    <li key={option} onClick={() => option === "Any" ? onChange([]) : select(option)} className="group/row block cursor-pointer px-3.75 transition-colors duration-100 hover:bg-[#f5f5f5]">
                                        <label className={`flex cursor-pointer items-center py-2.5 text-[13px] max-[676px]:text-[15px] ${checked ? "font-bold text-[#957e4e]" : "text-black"}`}>
                                            <span className={`mr-2 size-4.5 shrink-0 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat ${checked ? "border-[#957e4e] bg-[#957e4e] bg-[url(/img/check.svg)]" : "border-[#b5b5b5]"}`}></span>
                                            <p className="my-0 mr-0.75 ml-0">{option}</p>
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
