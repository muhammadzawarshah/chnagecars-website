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
                <button type="button" onClick={toggle} className={`flex h-12.5 w-full cursor-pointer items-center gap-3 border-0 pr-7.5 pl-4 text-left min-[981px]:h-15 min-[981px]:px-5 ${open ? "bg-white" : "bg-[#edeaea]"}`}>
                    <img src={icon} alt="" className="h-5 w-6 object-contain min-[981px]:h-6 min-[981px]:w-7" />
                    <span className="flex-1 text-[11.5px] tracking-[0.3px] text-[#222] min-[981px]:text-lg min-[981px]:tracking-normal">{title}</span>
                    <svg width="13" height="8" viewBox="0 0 12 7" fill="none" stroke="#111" strokeWidth="1.8" className={open ? "rotate-180" : ""}>
                        <path d="M1 1l5 5 5-5" />
                    </svg>
                </button>
                {open && rows && (
                    <div>
                        {rows.map(([label, value], index) => (
                            <div key={label} className={`flex h-11 items-center justify-between pr-7.5 pl-4 text-[11.5px] text-[#222] min-[981px]:h-13 min-[981px]:px-5 min-[981px]:text-base ${index % 2 === 0 ? "bg-[#edeaea]" : "bg-white"}`}>
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
