"use client"

import { useState } from "react"
import { ctas } from "../Data/blocks"
import CtaSlideCard from "./CtaSlideCard"

export default function CtaMobileGrid() {

    const [expanded, setExpanded] = useState(false);

    const visible = expanded ? ctas : ctas.slice(0, 2);

    return (
        <>
            <div className="mt-7.5 hidden max-[948px]:block">
                <div className="grid grid-cols-2 gap-5 px-2.5 max-[601px]:gap-3 max-[601px]:px-1.5">
                    {visible.map((cta) => (
                        <CtaSlideCard key={cta.title} cta={cta} />
                    ))}
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mx-auto mt-7.5 flex h-10 w-fit cursor-pointer items-center rounded-[5px] border-0 bg-[#957e4e] px-6 text-base font-semibold text-white max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]"
                >
                    {expanded ? "See Less" : "See More"}
                </button>
            </div>
        </>
    )
}
