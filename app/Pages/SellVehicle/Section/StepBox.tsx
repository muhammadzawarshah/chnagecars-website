import { ReactNode } from "react"

type StepBoxProps = {
    number: number
    title: string
    active: boolean
    summary?: string
    onEdit?: () => void
    children: ReactNode
}

export default function StepBox({ number, title, active, summary, onEdit, children }: StepBoxProps) {
    return (
        <>
            <div className="rounded-[10px] border border-[#212529] bg-white px-3 pt-2.5 pb-3">
                <div onClick={!active ? onEdit : undefined} className={`flex items-center gap-4 ${!active && onEdit ? "cursor-pointer" : ""}`}>
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full font-poppins text-[26px] leading-none font-medium text-white ${active ? "bg-gold" : "bg-[#333]"}`}>{number}</span>
                    <h3 className={`m-0 min-w-0 font-poppins text-[28px] leading-tight font-normal max-[601px]:text-[22px] ${active ? "text-gold" : "flex-1 text-center text-[#212529]"}`}>{title}</h3>
                </div>
                {!active && summary && <p className="mt-2 mb-0 text-center text-sm text-[#6c757d]">{summary}</p>}
                {active && <div className="mt-4">{children}</div>}
            </div>
        </>
    )
}
