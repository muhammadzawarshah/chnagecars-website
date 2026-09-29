import Link from "next/link"
import { howItWorks } from "./Data/sellCar"
import HowItWorksCard from "./Section/HowItWorksCard"
import SellCarForm from "./Section/SellCarForm"

export default function SellVehicle() {
    return (
        <>
            <main className="bg-[#f8fafd] pb-15 font-roboto">
                <div className="mx-auto w-full max-w-150 bg-white pb-8 min-[981px]:max-w-300 min-[981px]:pb-15">
                    <div className="flex h-14 items-center gap-4 px-3 min-[981px]:hidden">
                        <Link href="/" aria-label="Back" className="flex size-7 items-center justify-center">
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 7.5H2M7.5 1.5l-6 6 6 6" />
                            </svg>
                        </Link>
                        <h1 className="m-0 text-[18.5px] leading-none font-medium text-[#111]">Sell Car</h1>
                    </div>
                    <img src="/img/sell/sell-car-banner.jpg" alt="Want to sell your car? CHANGECARS helps you get competitive offers" className="block aspect-video w-full object-cover min-[981px]:aspect-[15/7]" />
                    <div className="px-3 min-[981px]:px-7.5">
                        <h2 className="mt-6.5 mb-0 text-center text-[18.5px] leading-6 font-normal text-gold uppercase min-[981px]:mt-12.5 min-[981px]:text-[32px] min-[981px]:leading-10">Sell your <strong className="font-bold">vehicle</strong></h2>
                        <p className="mt-3.5 mb-0 text-center text-[12.5px] leading-4.5 text-[#333] min-[981px]:mx-auto min-[981px]:mt-5 min-[981px]:max-w-250 min-[981px]:text-base min-[981px]:leading-6.5">
                            CHANGECARS makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                        </p>
                        <h2 className="mt-5 mb-0 text-[18.5px] leading-6 font-normal text-gold uppercase min-[981px]:mt-12.5 min-[981px]:text-[32px] min-[981px]:leading-10">How it <strong className="font-bold">works</strong></h2>
                        <div className="mt-3 flex flex-col gap-3.25 px-1 min-[981px]:mt-6 min-[981px]:grid min-[981px]:grid-cols-2 min-[981px]:gap-5 min-[981px]:px-0">
                            {howItWorks.map((item) => (
                                <HowItWorksCard key={item.title} item={item} />
                            ))}
                        </div>
                        <SellCarForm />
                    </div>
                </div>
            </main>
        </>
    )
}
