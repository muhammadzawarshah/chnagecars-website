"use client"

import { useState } from "react"
import DealerPopup from "./DealerPopup"

export default function DealerRating({ dealer }: { dealer: string }) {

    const [open, setOpen] = useState(false);
    const [first, ...rest] = dealer.split(" ");

    return (
        <>
            <div className="relative h-8.75 w-16.25 shrink-0">
                <div className="-ml-1.5 flex h-8.75 w-16.25 items-center justify-center bg-[url(/img/car-detail/orig/dealer-rating.svg)] bg-contain bg-no-repeat pr-1.5 text-sm leading-8.25 font-semibold text-[#3d3d3d]">
                    5<img src="/img/car-detail/orig/dealer-rating-star.svg" alt="" className="ml-0.5 size-2.75" />
                </div>
                <button type="button" onClick={() => setOpen(true)} aria-label="About this rating" className="absolute top-4.5 right-0 size-3.75 cursor-pointer border-0 bg-[url(/img/car-detail/orig/dealer-rating-i.svg)] bg-contain bg-no-repeat p-0"></button>
            </div>
            {open && (
                <DealerPopup onClose={() => setOpen(false)} className="min-h-86 border border-[#e6e6e6] py-5 text-center shadow-[20px_20px_20px_rgba(0,0,0,0.05)]">
                    <img src="/img/car-detail/orig/five-star-mark-of-excellence-black.png" alt="Five star mark of excellence" className="mx-auto mt-9 h-19.5 w-auto" />
                    <h3 className="mt-8.25 mb-5.5 px-2.5 text-2xl leading-[27.6px] font-light text-[#2f2f2f]">
                        {first} {rest.length > 0 && <span className="leading-4.75 font-bold text-gold uppercase">{rest.join(" ")}</span>}
                    </h3>
                    <p className="m-0 mb-3.75 px-5 text-base leading-[19.2px] font-bold text-[#4f4f4f]">This Dealership is Five star rated by <b className="font-black">CHANGECARS!</b> They offer exceptional service and products.</p>
                </DealerPopup>
            )}
        </>
    )
}
