"use client"

import { useEffect, useRef, useState } from "react"

type CheckSelectProps = {
    label: string
    options: string[]
    tall?: boolean
    listHeight: string
}

// The enquiry form's dropdowns: a rounded field that opens a black list of checkbox rows.
export default function CheckSelect({ label, options, tall = false, listHeight }: CheckSelectProps) {

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <>
            <div ref={ref} className="relative mb-3.25">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    className={`relative block w-full cursor-pointer truncate rounded-[20px] border border-gold bg-black/75 pr-10 pl-3.25 text-left font-sans text-sm leading-6.5 text-white ${tall ? "h-7.75" : "h-7.5"}`}
                >
                    {value || label}
                    <span className={`absolute top-2.5 right-4.25 border-x-7 border-t-9 border-x-transparent border-t-gold ${open ? "rotate-180" : ""}`}></span>
                </button>
                {open && (
                    <div className={`absolute inset-x-0 top-full z-46 overflow-y-auto rounded-[10px] border border-gold bg-black ${listHeight}`}>
                        <ul className="m-0 list-none py-2.5">
                            {options.map((option) => (
                                <li key={option} className="mt-1.25 pl-2.5">
                                    <button type="button" onClick={() => { setValue(option); setOpen(false); }} className="flex h-8 w-full cursor-pointer items-start border-0 bg-transparent p-0 text-left font-sans text-sm leading-8 text-[#f5f5f5]">
                                        <span className={`mt-1.75 mr-2 size-4.5 shrink-0 rounded-[3px] border border-[#d6d6d6] bg-white bg-center bg-no-repeat ${value === option ? "bg-[url(/img/check.svg)] bg-size-[12px]" : ""}`}></span>
                                        {option}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <input type="hidden" name={label} value={value} />
            </div>
        </>
    )
}
