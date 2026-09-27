import { ReactNode } from "react"
import FilterField from "../AppSearch/FilterField"

type FilterSelectProps = {
    label: string
    active: boolean
    open: boolean
    onToggle: () => void
    wide?: boolean
    children: ReactNode
}

export default function FilterSelect({ label, active, open, onToggle, wide = false, children }: FilterSelectProps) {
    return (
        <>
            <div data-select className={`relative ${wide ? "col-span-2" : ""} ${open ? "z-50" : ""}`}>
                <FilterField label={label} active={active} wide={wide} onClick={onToggle} />
                {open && children}
            </div>
        </>
    )
}
