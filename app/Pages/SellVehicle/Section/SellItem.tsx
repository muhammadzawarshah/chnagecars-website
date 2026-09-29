import { SellStep } from "../Data/howItWorks"

export default function SellItem({ step }: { step: SellStep }) {
    return (
        <>
            <div className="flex items-start">
                <img src={step.icon} alt="" className="mt-0.75 h-auto w-7 shrink-0" />
                <div className="ml-3 min-w-0">
                    <span className="block text-[17px] leading-7 font-bold text-[#2f2f2f]">{step.title}</span>
                    <p className="mt-1.5 mb-2.5 text-base leading-7 text-[#2f2f2f]">
                        {step.before ? <>{step.before} <strong>CHANGECARS</strong> {step.after}</> : step.after}
                    </p>
                </div>
            </div>
        </>
    )
}
