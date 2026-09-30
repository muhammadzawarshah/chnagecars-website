import { ReactNode } from "react"
import { sellNotice, sellSteps } from "../Data/howItWorks"

function Item({ icon, title, children }: { icon: ReactNode, title: string, children: ReactNode }) {
    return (
        <>
            <div className="flex w-full">
                {icon}
                <div className="ml-3 w-full">
                    <p className="m-0 mb-2.5 text-left text-base leading-7 tracking-[0.02em] text-[#2f2f2f]">
                        <span className="text-[17px] font-bold">{title}</span>
                    </p>
                    <p className="m-0 mb-2.5 text-left text-base leading-7 tracking-[0.02em] text-[#2f2f2f]">{children}</p>
                </div>
            </div>
        </>
    )
}

export default function HowItWorks() {
    return (
        <>
            <div className="w-full">
                <h2 className="my-[0.83em] text-center text-2xl leading-[1.15] font-normal text-gold">
                    <span>How it works</span>
                </h2>
                <div className="mb-5 w-full rounded-xl border border-black/25 p-3.75">
                    {sellSteps.map((step) => (
                        <Item key={step.title} icon={step.icon} title={step.title}>
                            {step.before} <strong>CHANGECARS</strong> {step.after}
                        </Item>
                    ))}
                </div>
                <Item icon={sellNotice.icon} title={sellNotice.title}>{sellNotice.text}</Item>
            </div>
        </>
    )
}
