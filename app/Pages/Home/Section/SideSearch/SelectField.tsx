import { ReactNode } from "react"
import AppField from "../AppSearch/AppField"

type SelectFieldProps = {
    label: string
    open: boolean
    onToggle: () => void
    wide?: boolean
    children: ReactNode
}

export default function SelectField({ label, open, onToggle, wide = false, children }: SelectFieldProps) {
    return (
        <>
            <div className={`relative ${wide ? "col-span-2" : ""} ${open ? "z-50" : ""}`}>
                <AppField label={label} wide={wide} open={open} onClick={onToggle} />
                {open && children}
            </div>
        </>
    )
}
