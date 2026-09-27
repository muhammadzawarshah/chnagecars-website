import { bodyTypes } from "../../Data/search"

type BodyTypeSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
}

export default function BodyTypeSelect({ selected, onChange }: BodyTypeSelectProps) {

    function toggle(name: string) {
        onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
    }

    return (
        <>
<<<<<<< HEAD
            <div className="absolute z-46 h-58.5 w-full overflow-y-scroll rounded-b bg-panel p-0">
=======
            <div className="absolute z-46 h-58.5 w-[208.5%] overflow-y-scroll rounded-b bg-panel p-0">
>>>>>>> origin/main
                <ul className="m-0 flex list-none flex-wrap p-0.5">
                    {bodyTypes.map((type) => (
                        <li
                            key={type.name}
                            onClick={() => toggle(type.name)}
                            className={`group/row m-0.5 min-h-26.25 w-[calc(33.334%-5px)] cursor-pointer rounded-[17px] border border-black/50 px-1.25 transition-colors duration-100 hover:bg-muted max-[981px]:w-[calc(25%-5px)] max-[661px]:w-[calc(33.334%-5px)] ${selected.includes(type.name) ? "bg-muted [&_label]:font-bold" : ""}`}
                        >
                            <div className="w-full text-center">
                                <img src={type.icon} alt={type.name} className="mx-auto h-13.75" />
                            </div>
                            <div className="-mt-1.75 flex flex-col items-center">
                                <label className="flex cursor-pointer flex-col items-center text-center text-[13px] leading-3.75 break-words whitespace-pre-line text-text-dark group-hover/row:text-white max-[676px]:text-[15px]">
                                    {type.label}
                                </label>
                                <span className="mt-0.75 mb-2 flex items-center justify-center text-[13px] leading-5 text-text-dark group-hover/row:text-white">(<em className="not-italic">{type.count}</em>)</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
