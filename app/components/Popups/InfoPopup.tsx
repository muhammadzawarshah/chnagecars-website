"use client"

import { usePopup } from "./PopupContext"

export default function InfoPopup() {

    const { active, open, close } = usePopup();
    const isOpen = active === "info";

    return (
        <>
            <span
                onClick={() => open("info")}
                className="fixed top-50 right-0 z-200 block h-10 max-w-80 min-w-40 translate-x-[calc(50%-25px)] transform-[rotate(90deg)] animate-[tilt-shaking_5s_infinite] cursor-pointer border-2 border-gold bg-black px-2.5 text-center leading-9.5 tracking-[1px] whitespace-nowrap text-white transition duration-100 hover:opacity-90"
            >
                CHECK THIS OUT
            </span>
            <div onClick={close} className={`fixed top-0 left-0 flex h-full w-full justify-center overflow-y-auto bg-black/64 p-5 ${isOpen ? "z-1100 items-center opacity-100" : "pointer-events-none -z-1 opacity-0"}`}>
                <div onClick={(e) => e.stopPropagation()} className={`relative mx-auto w-full max-w-150 rounded-[10px] bg-[rgba(26,26,26,0.75)] px-11.25 py-7.5 shadow-[7px_7px_20px_rgba(0,0,0,0.4)] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:block after:h-2.5 after:w-84.5 after:bg-gold after:content-[''] max-[921px]:px-5 max-[921px]:py-12.5 ${isOpen ? "top-auto max-h-[80vh]" : "-top-[200%]"}`}>
                    <div onClick={close} className="absolute top-5 right-5 z-550 size-3.75 cursor-pointer bg-[url(/img/close.svg)] bg-size-[15px] bg-center bg-no-repeat max-[601px]:scale-160"></div>
                    <div className="max-h-[50vh] overflow-auto text-white">
                        <div className="relative mx-auto mr-3">
                            <h3 className="my-[1em] text-[1.17em] font-bold">SELL YOUR VEHICLE</h3>
                            <div className="mb-8.75 text-sm leading-4.5 tracking-[0.02em] text-white">
                                Do You Drive Less Than 15,000 km a Year? We Want Your Car!<br /><br />
                                CHANGECARS is actively looking to purchase low-mileage, excellent condition vehicles. Whether it’s an Alfa Romeo, a Volvo, or anything in between, we’re interested!<br /><br />
                                If your car averages less than 15,000 km per year, we’d love to do business with you. We’ve created the perfect platform to make the process simple, fast, and rewarding<br /><br />
                                Get started today – selling your car has never been easier
                            </div>
                            <div className="mb-5 flex h-10 flex-row justify-center">
                                <a href="https://www.changecars.co.za/sell-your-vehicle" target="_blank" className="relative mx-2.5 h-10 cursor-pointer rounded-[5px] bg-gold px-5 text-center text-sm leading-10 font-normal whitespace-nowrap text-snow no-underline transition duration-100 hover:opacity-90">
                                    Sell Your Vehicle
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
