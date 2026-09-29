"use client"

import { useState } from "react"
import DealerPopup from "./DealerPopup"

export default function OpeningHours({ hours }: { hours?: { day: string, time: string }[] }) {

    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="h-10 cursor-pointer rounded-[5px] border border-[#c0a045] bg-white px-1.75 font-sans text-sm text-gold">Opening Hours</button>
            {open && (
                <DealerPopup onClose={() => setOpen(false)} className="p-5 shadow-[20px_2px_20px_rgba(0,0,0,0.2)]">
                    <h3 className="m-0 mb-8.25 text-2xl leading-[28.8px] font-bold text-gold">Opening Hours:</h3>
                    {hours?.length ? (
                        <ul className="m-0 list-none p-0">
                            {hours.map((row) => (
                                <li key={row.day} className="flex justify-between text-base leading-6.5 text-[#4f4f4f]">
                                    <strong>{row.day}</strong>
                                    <span>{row.time}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="m-0 text-base leading-6.5 text-[#4f4f4f]">Please contact the dealer for their opening hours.</p>
                    )}
                </DealerPopup>
            )}
        </>
    )
}
