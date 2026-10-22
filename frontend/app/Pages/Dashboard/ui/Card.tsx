import { ReactNode } from "react"

type CardProps = {
    title?: ReactNode
    action?: ReactNode
    className?: string
    children: ReactNode
}

export default function Card({ title, action, className = "", children }: CardProps) {
    return (
        <section className={`min-w-0 rounded-xl border border-[#ebe8e1] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.04)] max-[600px]:p-4 ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <h2 className="m-0 text-base font-bold text-ink">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    )
}
