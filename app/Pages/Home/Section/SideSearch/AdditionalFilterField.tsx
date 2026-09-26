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
                    className={`relative h-10 w-full cursor-pointer border-b px-3.25 text-sm leading-10 font-normal text-white after:absolute after:top-1/2 after:right-4.25 after:block after:-translate-y-1/2 after:border-x-4 after:border-x-transparent after:content-[''] max-[676px]:text-base ${open ? "rounded-t border-muted bg-muted after:border-b-6 after:border-b-[#d6d6d6]" : "rounded-t-[3px] border-white bg-[#282828] after:border-t-6 after:border-t-white"}`}
                >
                    {label}
                </div>
                {open && (
                    <div className="absolute z-46 max-h-32.75 w-full overflow-y-scroll rounded-b bg-panel p-0">
                        {filter.info && <p className="mx-0 mt-0 mb-1.5 px-3.5 pt-2 text-[13px] leading-4.25 text-text-dark">{filter.info}</p>}
                        <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                            {options.map((option) => {
                                const checked = option === "Any" ? selected.length === 0 : selected.includes(option);
                                return (
                                    <li key={option} onClick={() => option === "Any" ? onChange([]) : select(option)} className="group/row block cursor-pointer px-3.75 transition-colors duration-100 hover:bg-muted">
                                        <label className={`flex cursor-pointer items-center py-2.5 text-[13px] text-text-dark group-hover/row:text-white max-[676px]:text-[15px] ${checked ? "font-bold" : ""}`}>
                                            <span className={`mr-2 size-4.5 shrink-0 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat ${checked ? "border-text-dark bg-text-dark bg-[url(/img/check.svg)]" : "border-[#7c7c7c] group-hover/row:border-white"}`}></span>
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
