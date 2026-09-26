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
        <div className={`group/row relative h-8 leading-8 transition-colors duration-100 hover:bg-muted ${indent} ${rowClass}`}>
            <label onClick={onSelect} className={`float-left h-8 cursor-pointer overflow-hidden pl-2 text-[13px] leading-8 text-text-dark group-hover/row:text-white ${checked || partial ? "font-bold" : ""}`}>
                <Checkbox checked={checked} partial={partial} />
                {label}
            </label>
            {onToggle && (
                <>
                    <span onClick={onToggle} className="relative z-5 float-right h-8 cursor-pointer pr-5.5 text-sm leading-8 font-light text-white opacity-0 transition-opacity duration-100 group-hover/row:opacity-100">
                        {open ? `Hide ${toggleLabel}` : `Show ${toggleLabel}`}
                    </span>
                    <span onClick={onToggle} className={`absolute top-3 right-2 block cursor-pointer border-x-5 border-x-transparent ${open ? "border-b-9 border-b-white" : "border-t-6 border-t-text-dark"}`}></span>
                </>
            )}
        </div>
    )
}
