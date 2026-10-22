import { ReactNode } from "react"

type SellFieldProps = {
    label: string
    required?: boolean
    error?: string
    hint?: string
    className?: string
    children: ReactNode
}

export default function SellField({ label, required = false, error, hint, className = "", children }: SellFieldProps) {
    return (
        <>
            <div className={`min-w-0 ${className}`}>
                <p className="mt-0 mb-1.5 text-[11px] leading-4 font-medium text-[#222] min-[981px]:mb-2 min-[981px]:text-sm min-[981px]:leading-5">
                    {label}{required && <span className="text-[#e53935]">*</span>}
                </p>
                {children}
                {hint && <p className="mt-1 mb-0 pl-0.5 text-[11px] leading-4 text-[#9e9e9e] min-[981px]:text-[13px] min-[981px]:leading-5">{hint}</p>}
                {error && <p className="mt-1 mb-0 text-[11px] leading-4 text-[#e53935] min-[981px]:text-[13px] min-[981px]:leading-5">{error}</p>}
            </div>
        </>
    )
}
