import { colours } from "../../Data/search"

type ColourSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
}

export default function ColourSelect({ selected, onChange }: ColourSelectProps) {

    function toggle(name: string) {
        onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
    }

    const options = [{ name: "Any", hex: "#DDDCDC" }, ...colours];

    return (
        <>
            <div className="absolute right-0 bottom-full z-49 max-h-72.5 w-full overflow-y-auto rounded-t bg-panel">
                <ul className="m-0 block w-full overflow-hidden p-0">
                    {options.map((colour) => {
                        const checked = colour.name === "Any" ? selected.length === 0 : selected.includes(colour.name);
                        const bordered = colour.name === "Any" || colour.name === "Unknown";
                        return (
                            <li
                                key={colour.name}
                                onClick={() => colour.name === "Any" ? onChange([]) : toggle(colour.name)}
                                className="group/row float-left m-0 block h-10.5 w-full cursor-pointer py-1.25 leading-10.5 transition-colors duration-100 hover:bg-muted"
                            >
                                <label className={`float-left flex h-8 w-full cursor-pointer items-center gap-1.5 px-3.5 text-sm leading-8 text-text-dark group-hover/row:text-white max-[676px]:text-[15px] ${checked ? "font-bold" : ""}`}>
                                    <span className={`size-4.5 min-w-4.5 shrink-0 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat ${checked ? "border-text-dark bg-text-dark bg-[url(/img/check.svg)]" : "border-[#7c7c7c] bg-panel group-hover/row:border-white group-hover/row:bg-muted"}`}></span>
                                    <span className={`inline-block size-4.25 min-w-4.25 shrink-0 rounded-full ${bordered ? "border border-[#7C7C7C]" : ""}`} style={{ backgroundColor: colour.hex }}></span>
                                    {colour.name}
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </>
    )
}
