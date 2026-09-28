export default function SellVehicleCard() {
    return (
        <>
            <div className="rounded-[10px] bg-[#e8e4e2] px-10 py-10 text-center shadow-[0_2px_6px_rgba(0,0,0,0.15)] max-[601px]:px-4.75 max-[601px]:pt-4.25 max-[601px]:pb-5">
                <h2 className="m-0 text-[32px] leading-9.75 font-normal text-[#957e4e] uppercase max-[601px]:text-base max-[601px]:leading-[1.2]">
                    Sell your <strong className="font-bold">Vehicle</strong>
                </h2>
                <p className="mx-auto mt-4 mb-0 max-w-250 text-base leading-6.5 text-[#111] max-[601px]:mt-2.5 max-[601px]:max-w-none max-[601px]:text-left max-[601px]:text-xs max-[601px]:leading-4">
                    <strong>CHANGECARS</strong> makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                </p>
                <a href="https://www.changecars.co.za/sell-your-vehicle" className="mt-6 inline-flex h-10 items-center gap-2.5 rounded-[5px] bg-[#957e4e] px-5 text-base font-semibold text-white no-underline max-[601px]:mt-3.5 max-[601px]:h-7 max-[601px]:gap-1.5 max-[601px]:px-3.25 max-[601px]:text-xs">
                    <img src="/img/private-sellers/key-in-hand.svg" alt="" className="h-4 w-5 max-[601px]:h-3.5 max-[601px]:w-4.5" />
                    Sell Your Vehicle
                </a>
            </div>
        </>
    )
}
