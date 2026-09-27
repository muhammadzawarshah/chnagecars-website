import Checkbox from "./Checkbox"

type TreeRowProps = {
    label: string
    checked: boolean
    partial?: boolean
    toggleLabel?: string
    open?: boolean
    indent: string
    rowClass: string
    onSelect: () => void
    onToggle?: () => void
}

export default function TreeRow({ label, checked, partial = false, toggleLabel, open = false, indent, rowClass, onSelect, onToggle }: TreeRowProps) {
    return (
        <div className={`group/row relative h-8 leading-8 transition-colors max-[676px]:h-11.25 max-[676px]:leading-11.25 duration-100 hover:bg-muted ${indent} ${rowClass}`}>
            <label onClick={onSelect} className={`float-left h-8 cursor-pointer overflow-hidden pl-2 text-[13px] leading-8 text-text-dark max-[676px]:h-11.25 max-[676px]:text-[15px] max-[676px]:leading-11.25 group-hover/row:text-white ${checked || partial ? "font-bold" : ""}`}>
                <Checkbox checked={checked} partial={partial} />
                {label}
            </label>
            {onToggle && (
                <>
                    <span onClick={onToggle} className="relative z-5 float-right h-8 cursor-pointer pr-5.5 text-sm leading-8 max-[676px]:h-11.25 max-[676px]:leading-11.25 font-light text-white opacity-0 transition-opacity duration-100 group-hover/row:opacity-100">
                        {open ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
                    </span>
                    <span onClick={onToggle} className={`absolute top-3 right-2 block max-[676px]:top-4.75 cursor-pointer border-x-5 border-x-transparent ${open ? "border-b-9 border-b-white" : "border-t-6 border-t-text-dark"}`}></span>
                </>
            )}
        </div>
    )
}
