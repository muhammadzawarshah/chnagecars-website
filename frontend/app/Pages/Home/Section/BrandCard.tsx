"use client"

import { useState } from "react"
import { Brand } from "../Data/brands"

export default function BrandCard({ brand }: { brand: Brand }) {

    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="flex w-full justify-center">
                <img src={brand.logo} alt={brand.name} className="mx-auto h-20 max-w-full object-contain max-[601px]:h-14" />
            </div>
            <p className="my-5 text-center text-xl wrap-anywhere max-[601px]:my-3 max-[601px]:text-base">
                <a href={brand.href} className="font-normal text-gold no-underline hover:opacity-70">{brand.name}</a>
            </p>
            <span onClick={() => setOpen(!open)} className={`relative flex cursor-pointer justify-center pb-2.5 transition duration-500 after:absolute after:top-2 after:left-[calc(50%+35px)] max-[601px]:text-sm max-[601px]:after:top-1.5 max-[601px]:after:left-[calc(50%+29px)] after:block after:border-x-5 after:border-t-6 after:border-x-transparent after:border-t-gold after:transition after:duration-500 after:content-[''] ${open ? "after:rotate-180" : ""}`}>
                Models
            </span>
            <div className={`block overflow-hidden transition-[max-height] duration-500 ${open ? "max-h-125" : "max-h-0"}`}>
                {brand.models.map((model, index) => (
                    <p key={model.href} className={`text-center ${index === 0 ? "m-0" : "mt-2.5 mb-0"}`}>
                        <a href={model.href} className="text-base font-normal text-coal no-underline hover:text-gold max-[601px]:text-sm">{model.name}</a>
                    </p>
                ))}
            </div>
        </>
    )
}
