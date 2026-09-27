"use client"

import { useState } from "react"
import { Dealer } from "../Data/dealers"

export default function DealerCard({ dealer }: { dealer: Dealer }) {

    const [showRating, setShowRating] = useState(false);

    return (
        <>
            <div className={`absolute z-98 flex h-full w-full flex-col items-center justify-center rounded-[10px] border border-[#e6e6e6] bg-white px-0 py-5 shadow-[20px_20px_20px_0px_rgba(0,0,0,0.051)] transition-opacity duration-200 ${showRating ? "opacity-100" : "pointer-events-none opacity-0 select-none"}`}>
                <span onClick={() => setShowRating(false)} className="absolute top-2.5 right-2.5 size-5.5 cursor-pointer">
                    <img src="/img/dealer-popup-close.svg" alt="Close" className="size-full" />
                </span>
                <img src="/img/five-star-mark-of-excellence-black.png" alt="Five star rating" className="h-auto w-22.75" />
                <h3 className="my-5.5 max-h-6.25 overflow-hidden px-2.5 text-center text-2xl leading-6 font-bold text-gold uppercase">{dealer.name}</h3>
                <p className="mt-0 mb-3.75 px-5 text-center text-base leading-[19.2px] font-bold text-[#4f4f4f]">
                    This Dealership is Five star rated by <b>CHANGECARS!</b> They offer exceptional service and products.
                </p>
            </div>
            <div onClick={() => setShowRating(true)} className="absolute -top-3 right-7.5 z-99 block h-8.75 w-16.25 cursor-pointer bg-[url(/img/dealer-rating.svg)] bg-contain bg-top bg-no-repeat pr-1.5 text-center text-sm leading-8.25 font-semibold text-[#3d3d3d]">
                5 <img src="/img/dealer-rating-star.svg" alt="" className="inline" />
            </div>
            <a href={dealer.href} className="block cursor-pointer no-underline">
                <span className="mx-auto mt-6.25 block h-20 w-50 max-w-[calc(100%-20px)] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${dealer.logo})` }}></span>
                <h3 className="mt-5 mb-3.75 max-h-6.25 overflow-hidden px-5 text-center text-xl leading-6 font-bold text-slate uppercase">{dealer.name}</h3>
                <p className="mt-3.5 mb-7.5 line-clamp-3 h-19.5 overflow-hidden px-5 text-sm leading-6.5 font-normal text-slate">{dealer.description}</p>
                <h4 className="m-0 h-8.75 overflow-hidden rounded-b-[10px] border border-gold bg-gold px-2.5 py-2 text-center font-inter text-[13px] leading-4.75 font-bold whitespace-nowrap text-white uppercase no-underline">View Dealer</h4>
            </a>
        </>
    )
}
