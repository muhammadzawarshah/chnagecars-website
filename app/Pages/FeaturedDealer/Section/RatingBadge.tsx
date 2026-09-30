"use client"

import { useState } from "react"

// Gold "5★" badge beside the dealer text; clicking it opens the five-star card underneath.
export default function RatingBadge({ name, href }: { name: string, href: string }) {

    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" onClick={() => setOpen(!open)} aria-label="About this rating" className="absolute top-[87px] left-0 h-8.75 w-16.25 cursor-pointer border-0 bg-[url(/img/dealer-rating.svg)] bg-contain bg-no-repeat p-0 pr-1.5 text-center font-sans text-sm leading-8.25 font-semibold text-[#3d3d3d]">
                5 <img src="/img/dealer-rating-star.svg" alt="" className="inline size-2.75 align-baseline" />
            </button>
            {open && (
                <div className="absolute top-[135px] left-0 z-6000 flex h-86 w-88.75 flex-col items-center justify-center rounded-[10px] border border-[#e6e6e6] bg-white py-5 text-center font-sans shadow-[20px_20px_20px_rgba(0,0,0,0.05)]">
                    <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-2.5 right-2.5 size-5.5 cursor-pointer border-0 bg-[url(/img/dealer-popup-close.svg)] bg-contain bg-no-repeat p-0"></button>
                    <img src="/img/five-star-mark-of-excellence-black.png" alt="Five star mark of excellence" className="block h-19.5 w-22.75" />
                    <h3 className="mt-8.25 mb-5.5 px-2.5 text-2xl leading-[27.6px] font-bold text-gold">{name}</h3>
                    <p className="m-0 mb-3.75 px-5 text-base leading-[19.2px] font-bold tracking-[0.32px] text-[#4f4f4f]">This Dealership is Five star rated by <b className="font-black">CHANGECARS!</b> They offer exceptional service and products.</p>
                    <a href={href} className="block h-8 rounded-[5px] bg-gold px-5 text-sm leading-8 font-normal text-white uppercase no-underline transition duration-500 hover:opacity-90">Explore</a>
                </div>
            )}
        </>
    )
}
