export default function SellVehicleCard() {
    return (
        <>
            <div className="rounded-[10px] bg-[#e8e4e2] px-4.75 pt-4.25 pb-5 text-center shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
                <h2 className="m-0 text-base leading-[1.2] font-normal text-[#957e4e] uppercase">
                    Sell your <strong className="font-bold">Vehicle</strong>
                </h2>
                <p className="mt-2.5 mb-0 text-left text-xs leading-4 text-[#111]">
                    <strong>CHANGECARS</strong> makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                </p>
                <a href="https://www.changecars.co.za/sell-your-vehicle" className="mt-3.5 inline-flex h-7 items-center gap-1.5 rounded-[5px] bg-[#957e4e] px-3.25 text-xs font-semibold text-white no-underline">
                    <img src="/img/private-sellers/key-in-hand.svg" alt="" className="h-3.5 w-4.5" />
                    Sell Your Vehicle
                </a>
            </div>
        </>
    )
}
