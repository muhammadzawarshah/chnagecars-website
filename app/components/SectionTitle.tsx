import { ReactNode } from "react"

export default function SectionTitle({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <h2 className={`mx-auto mt-0 mb-7 text-center text-[32px] leading-9.75 font-extralight text-gold uppercase [&_strong]:font-black [&_span]:font-black ${className}`}>
            {children}
        </h2>
    )
}
