import { HowItWorksItem } from "../Data/sellCar"

export default function HowItWorksCard({ item }: { item: HowItWorksItem }) {
    return (
        <>
            <div className="flex items-start rounded-[10px] border-[1.5px] border-[#e7e1d3] bg-white py-2.5 pr-3 pl-3.5">
                <span className="flex w-10.5 shrink-0 justify-center pt-1.5">
                    <img src={item.icon} alt="" className={`h-auto ${item.iconWidth}`} />
                </span>
                <div className="ml-2.5 min-w-0">
                    <h3 className="m-0 text-[13.5px] leading-5 font-medium text-[#222]">{item.title}</h3>
                    <p className="mt-0.5 mb-0 text-[12.5px] leading-4.5 text-[#333]">
                        {item.before ? <>{item.before} <strong className="font-bold">CHANGECARS</strong> {item.after}</> : item.after}
                    </p>
                </div>
            </div>
        </>
    )
}
