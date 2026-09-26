import { ReactNode } from "react"

type SelectFieldProps = {
    label: string
    open: boolean
    onToggle: () => void
    small?: boolean
    className?: string
    children: ReactNode
}

export default function SelectField({ label, open, onToggle, small = false, className = "", children }: SelectFieldProps) {
    return (
        <>
            <div className={`relative mb-6.25 h-10 ${className}`}>
                <div
                    onClick={onToggle}
                    className={`relative h-10 w-full cursor-pointer overflow-hidden border-b px-3.25 leading-10 font-normal text-ellipsis whitespace-nowrap text-white after:absolute after:top-4.25 after:right-4.25 after:block after:border-x-4 after:border-x-transparent after:content-[''] ${small ? "text-[13px]" : "text-sm max-[676px]:text-base"} ${open ? "rounded-t-sm border-muted bg-muted after:border-b-6 after:border-b-[#d6d6d6]" : "rounded-t-[3px] border-white bg-[rgba(245,245,245,0.05)] after:border-t-6 after:border-t-white"}`}
                >
                    {label}
                </div>
                {open && children}
            </div>
        </>
    )
}
