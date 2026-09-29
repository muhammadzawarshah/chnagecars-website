"use client"

import { useEffect, useRef, useState } from "react"
import FinanceCalculator from "./FinanceCalculator"

export type SpecGroup = {
    icon: string
    title: string
    rows?: [string, string][]
    calculator?: number
}

// Technical specifications list; the finance row holds the calculator and also opens from the price.
export default function SpecAccordion({ groups }: { groups: SpecGroup[] }) {

    const [open, setOpen] = useState<string | null>(null);
    const finance = useRef<HTMLLIElement>(null);

    useEffect(() => {
        function showFinance() {
            const group = groups.find((item) => item.calculator);
            if (!group) return;
            setOpen(group.title);
            setTimeout(() => finance.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }
        window.addEventListener("open-finance", showFinance);
        return () => window.removeEventListener("open-finance", showFinance);
    }, [groups]);

    return (
        <>
            <ul className="m-0 list-none border-t border-[#d6d6d6] p-0">
                {groups.map((group) => (
                    <li key={group.title} ref={group.calculator ? finance : undefined} className="scroll-mt-5 border-b border-[#d6d6d6]">
                        <button
                            type="button"
                            onClick={() => setOpen(open === group.title ? null : group.title)}
                            aria-expanded={open === group.title}
                            className="relative block h-12.25 w-full cursor-pointer border-0 bg-transparent pr-6.25 pl-12.5 text-left font-sans text-sm leading-12.25 font-medium text-black uppercase"
                        >
                            <img src={group.icon} alt="" className="absolute top-1/2 left-2.5 max-h-6 -translate-y-1/2" />
                            {group.title}
                            <span className={`absolute top-5.25 right-4.25 border-x-7 border-t-9 border-x-transparent border-t-gold ${open === group.title ? "rotate-180" : ""}`}></span>
                        </button>
                        {open === group.title && group.rows && (
                            <ul className="m-0 list-none p-0 pb-3.75">
                                {group.rows.map(([label, value], index) => (
                                    <li key={label} className={`flex px-6.5 py-3.75 text-base leading-[18.4px] text-ink ${index % 2 === 0 ? "bg-[#f5f5f5]" : ""}`}>
                                        <span className="w-1/2 pr-2.5">{label}</span>
                                        <strong className="w-1/2">{value}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {open === group.title && group.calculator !== undefined && (
                            <div>
                                <FinanceCalculator price={group.calculator} />
                                <button type="button" onClick={() => setOpen(null)} className="mx-auto mt-1.25 mb-5 block h-9.75 w-39 cursor-pointer rounded-[5px] border-0 bg-[#0a0a0a] font-sans text-lg leading-9.75 font-medium text-white">Close</button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </>
    )
}
