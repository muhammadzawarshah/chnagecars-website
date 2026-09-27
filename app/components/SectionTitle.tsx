import { ReactNode } from "react"

export default function SectionTitle({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <h2 className={`mx-auto mt-0 mb-7 text-center text-[32px] leading-9.75 font-extralight text-gold uppercase wrap-anywhere max-[401px]:text-[26px] max-[401px]:leading-8 max-[301px]:text-[21px] max-[301px]:leading-6.5 max-[221px]:text-[17px] max-[221px]:leading-5.5 [&_strong]:font-black [&_span]:font-black ${className}`}>
            {children}
        </h2>
    )
}
