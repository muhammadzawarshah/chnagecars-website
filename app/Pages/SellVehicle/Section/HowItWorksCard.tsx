import { HowItWorksItem } from "../Data/sellCar"

export default function HowItWorksCard({ item }: { item: HowItWorksItem }) {
    return (
        <>
            <div className="flex items-start rounded-[10px] border-[1.5px] border-[#e7e1d3] bg-white py-2.5 pr-3 pl-3.5 min-[981px]:h-full min-[981px]:px-5 min-[981px]:py-5">
                <span className="flex w-10.5 shrink-0 justify-center pt-1.5 min-[981px]:w-14 min-[981px]:scale-125 min-[981px]:pt-2.5">
                    <img src={item.icon} alt="" className={`h-auto ${item.iconWidth}`} />
                </span>
                <div className="ml-2.5 min-w-0 min-[981px]:ml-4">
                    <h3 className="m-0 text-[13.5px] leading-5 font-medium text-[#222] min-[981px]:text-lg min-[981px]:leading-7">{item.title}</h3>
                    <p className="mt-0.5 mb-0 text-[12.5px] leading-4.5 text-[#333] min-[981px]:mt-1 min-[981px]:text-base min-[981px]:leading-6.5">
                        {item.before ? <>{item.before} <strong className="font-bold">CHANGECARS</strong> {item.after}</> : item.after}
                    </p>
                </div>
            </div>
        </>
    )
}
