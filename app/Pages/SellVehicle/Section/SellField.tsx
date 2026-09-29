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
                <p className="mt-0 mb-1.5 text-[11px] leading-4 font-medium text-[#222]">
                    {label}{required && <span className="text-[#e53935]">*</span>}
                </p>
                {children}
                {hint && <p className="mt-1 mb-0 pl-0.5 text-[11px] leading-4 text-[#9e9e9e]">{hint}</p>}
                {error && <p className="mt-1 mb-0 text-[11px] leading-4 text-[#e53935]">{error}</p>}
            </div>
        </>
    )
}
