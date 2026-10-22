import { useLanguage } from "../../../../components/Language/LanguageContext"

type ListSelectProps = {
    options: string[]
    counts?: Record<string, number>
    selected: string | null
    scroll?: boolean
    onSelect: (value: string | null) => void
}

export default function ListSelect({ options, counts, selected, scroll = true, onSelect }: ListSelectProps) {

    const { t } = useLanguage();
    const items = ["", ...options];

    return (
        <>
            <div className={`absolute z-46 w-full rounded-b bg-panel p-0 ${scroll ? "max-h-32.75 overflow-y-scroll" : ""}`}>
                <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                    {items.map((option) => {
                        const checked = option === "" ? selected === null : selected === option;
                        return (
                            <li
                                key={option || "any"}
                                onClick={() => onSelect(option === "" ? null : option)}
                                className="group/row m-0 block h-10.5 cursor-pointer px-3.75 py-1.25 transition-colors duration-100 hover:bg-muted"
                            >
                                <label className={`float-left h-8 w-full cursor-pointer overflow-hidden text-[13px] leading-8 text-ellipsis whitespace-nowrap text-text-dark group-hover/row:text-white max-[676px]:text-[15px] ${checked ? "font-bold" : ""}`}>
                                    <span className={`float-left mt-1.75 mr-2 block size-4.5 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat ${checked ? "border-text-dark bg-text-dark bg-[url(/img/check.svg)]" : "border-[#7c7c7c] group-hover/row:border-white"}`}></span>
                                    {option || t.any}
                                    {counts && option !== "" && <> (<em className="not-italic">{counts[option]}</em>)</>}
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </>
    )
}
