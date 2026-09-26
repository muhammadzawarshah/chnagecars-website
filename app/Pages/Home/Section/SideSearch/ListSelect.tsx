import Checkbox from "./Checkbox"

type ListSelectProps = {
    options: string[]
    counts?: Record<string, number>
    selected: string | null
    onSelect: (value: string | null) => void
}

export default function ListSelect({ options, counts, selected, onSelect }: ListSelectProps) {

    const row = "group/row h-8 cursor-pointer pl-2.5 leading-8 transition-colors duration-100 hover:bg-muted";
    const label = "block cursor-pointer pl-2 text-[13px] text-text-dark group-hover/row:text-white";

    return (
        <>
            <div className="absolute z-48 max-h-58.5 w-full overflow-y-auto rounded-b bg-panel">
                <ul className="m-0 list-none p-0">
                    <li onClick={() => onSelect(null)} className={row}>
                        <label className={`${label} ${selected === null ? "font-bold" : ""}`}>
                            <Checkbox checked={selected === null} />
                            Any
                        </label>
                    </li>
                    {options.map((option) => (
                        <li key={option} onClick={() => onSelect(option)} className={row}>
                            <label className={`${label} ${selected === option ? "font-bold" : ""}`}>
                                <Checkbox checked={selected === option} />
                                {option}
                                {counts && <> (<em>{counts[option]}</em>)</>}
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
