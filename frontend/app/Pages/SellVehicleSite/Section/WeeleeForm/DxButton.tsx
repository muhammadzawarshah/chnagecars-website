import { ReactNode } from "react"

type DxButtonProps = {
    onClick: () => void
    className?: string
    children: ReactNode
}

// dxButton "success" in the form's gold, as on the live form (no hover change).
export default function DxButton({ onClick, className = "", children }: DxButtonProps) {
    return (
        <>
            <button type="button" onClick={onClick} className={`flex h-[55px] cursor-pointer items-center justify-center rounded-[4px] border border-transparent bg-gold pt-[7px] pb-2 pl-[18px] font-dx text-lg leading-[normal] text-white outline-none ${className}`}>
                {children}
            </button>
        </>
    )
}
