"use client"

import { useState } from "react"

type SpecAccordionProps = {
    icon: string
    title: string
    rows?: [string, string][]
    onOpen?: () => void
}

export default function SpecAccordion({ icon, title, rows, onOpen }: SpecAccordionProps) {

    const [open, setOpen] = useState(false);

    function toggle() {
        if (onOpen) onOpen();
        else setOpen(!open);
    }

    return (
        <>
            <div>
                <button type="button" onClick={toggle} className={`flex h-12.5 w-full cursor-pointer items-center gap-3 border-0 px-3 text-left min-[981px]:h-15 min-[981px]:px-5 ${open ? "bg-white" : "bg-[#eeeeee]"}`}>
                    <img src={icon} alt="" className="h-5 w-6 object-contain min-[981px]:h-6 min-[981px]:w-7" />
                    <span className="flex-1 text-[13.5px] text-[#222] min-[981px]:text-lg">{title}</span>
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" stroke="#333" strokeWidth="1.6" className={open ? "rotate-180" : ""}>
                        <path d="M1 1l5 5 5-5" />
                    </svg>
                </button>
                {open && rows && (
                    <div>
                        {rows.map(([label, value], index) => (
                            <div key={label} className={`flex h-11 items-center justify-between px-3 text-[13px] text-[#222] min-[981px]:h-13 min-[981px]:px-5 min-[981px]:text-base ${index % 2 === 0 ? "bg-[#eeeeee]" : "bg-white"}`}>
                                <span>{label}</span>
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
