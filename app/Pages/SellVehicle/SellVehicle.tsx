import { sellNotice, sellSteps } from "./Data/howItWorks"
import SellItem from "./Section/SellItem"
import SellForm from "./Section/SellForm"

export default function SellVehicle() {
    return (
        <>
            <main className="bg-[#48484a] bg-[url(/img/sell-vehicle-bg.jpg)] bg-cover bg-fixed bg-center px-2.5 pt-2 pb-12.5">
                <div className="overflow-hidden rounded-xl">
                    <div className="relative bg-black/40 px-7.5 pt-7.5 pb-15 max-[601px]:px-5">
                        <h1 className="m-0 text-[32px] leading-8 font-light text-white uppercase max-[401px]:text-[26px]">
                            Sell your <strong className="font-bold text-gold">vehicle</strong>
                        </h1>
                        <span className="absolute bottom-0 left-0 h-7.5 w-[76%] bg-gold/60 [clip-path:polygon(0_0,0_100%,100%_100%)]"></span>
                        <span className="absolute right-0 bottom-0 h-7.5 w-[76%] bg-gold/60 [clip-path:polygon(100%_0,0_100%,100%_100%)]"></span>
                    </div>
                    <div className="grid grid-cols-[1fr_584px] gap-3.75 bg-white/30 p-3.75 max-[1101px]:grid-cols-1">
                        <div className="rounded-[15px] bg-white px-7.5 py-5 max-[601px]:px-4">
                            <p className="mt-0 mb-5.5 text-[17px] leading-7 text-[#2f2f2f]">
                                <strong>CHANGECARS</strong> makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                            </p>
                            <h2 className="my-5 text-center text-2xl font-normal text-gold">How it works</h2>
                            <div className="mb-5 rounded-xl border border-black/25 p-3.75">
                                {sellSteps.map((step) => (
                                    <SellItem key={step.title} step={step} />
                                ))}
                            </div>
                            <SellItem step={sellNotice} />
                        </div>
                        <div className="rounded-[15px] bg-white p-4 max-[601px]:p-3">
                            <SellForm />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
