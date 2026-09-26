"use client"

import { usePopup } from "./PopupContext"

export default function ScreanPopup() {

    const { active, close } = usePopup();
    const isOpen = active === "screan";

    return (
        <div className={`fixed right-0 left-0 z-99999 m-auto h-full transition-all duration-400 ${isOpen ? "top-0 opacity-100" : "-top-500 opacity-0"}`}>
            <div onClick={close} className="flex h-full w-full items-center justify-center bg-black/70 p-5">
                <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-212.5 rounded-[5px] bg-black/50">
                    <a onClick={close} className="absolute top-8 right-8 z-1 block size-3.75 cursor-pointer bg-[url(/img/close-popup.svg)] bg-contain bg-center bg-no-repeat max-[501px]:size-5"></a>
                    <div className="flex h-full w-full flex-col items-center rounded-[5px] bg-[linear-gradient(0deg,#1a1a1a_0%,rgba(26,26,26,0.8)_100%),url(/img/keep-it-or-cc-bg-image.jpg)] bg-cover bg-position-[center_top] bg-no-repeat p-17.5 text-center max-[741px]:px-10 max-[741px]:pt-12.5 max-[741px]:pb-10">
                        <div className="z-10 mx-0 mt-0 mb-3.75 flex max-w-115 justify-center gap-5 px-2.5 max-[561px]:max-w-75">
                            <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                            <span className="block h-12.5 w-0.5 shrink-0 bg-gold max-[561px]:h-7.5"></span>
                            <img src="/img/logo.svg" alt="Concierge Service logo" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                        </div>
                        <p className="mt-0 mb-6.25 text-center text-white">CHANGECARS has one goal and that is to be the Platform Buyers Trust!</p>
                        <p className="mt-0 mb-6.25 text-center text-white">We work with the best Dealerships in the country and we are proud of that.</p>
                        <p className="mt-0 mb-6.25 text-center text-white">For added peace of mind we have partnered with Screan an independent Vehicle Inspection Service.</p>
                        <a href="https://screan.co.za/" target="_blank" className="mt-5 inline-block h-10 rounded-[5px] bg-gold px-3.75 text-sm leading-9.75 text-white no-underline transition duration-500 hover:opacity-80">
                            TAKE ME TO SCREAN
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
