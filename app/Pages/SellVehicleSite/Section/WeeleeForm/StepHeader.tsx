import { EditIcon } from "./Icons"

type StepHeaderProps = {
    number: number
    title: string
    state: "idle" | "active" | "done"
    // Text offsets differ per step on the live form.
    textClass: string
    // Step 1 keeps its title unconstrained while it is open.
    wide?: boolean
    // Step 1's edit button keeps a 16px gap from the title.
    first?: boolean
    onEdit?: () => void
}

export default function StepHeader({ number, title, state, textClass, wide = false, first = false, onEdit }: StepHeaderProps) {
    return (
        <>
            <div className="-mx-3 flex">
                <div className={`flow-root w-full shrink-0 pr-3 pb-2 pl-2 @min-[768px]:py-6 @min-[768px]:pl-6 ${number === 1 ? "pt-1" : "pt-2"}`}>
                    <div className={`float-left ms-6 size-11 rounded-[30px] ${state === "idle" ? "bg-[#3a3a3a]" : "relative top-[1.7px] z-5 bg-gold"}`}>
                        {state === "done" ? (
                            <div className="h-11 bg-[url(/img/sell/stage-done.svg)] bg-center bg-no-repeat"></div>
                        ) : (
                            <div className="text-center font-poppins text-[30px] leading-[45px] font-bold tracking-[-1px] text-white">{number}</div>
                        )}
                    </div>
                    <div className={`float-left ms-6 text-center font-poppins text-[length:min(5.7cqw,30px)] leading-[1.5] font-normal tracking-[-1px] wrap-break-word @min-[768px]:text-left ${state === "idle" ? "text-[#3a3a3a]" : "text-gold"} ${wide && state !== "done" ? "" : "w-[49%]"} ${textClass}`}>
                        {title}
                    </div>
                    {state === "done" && (
                        // Sized like the live dxButton: 100% of the header row, measured before the button is placed,
                        // so on narrow widths it drops under the title and hangs over the box border.
                        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`} className={`float-right flex h-full w-[47px] cursor-pointer items-center rounded-[4px] bg-white p-2 text-gold ${first ? "ml-4" : ""}`}>
                            <EditIcon />
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
