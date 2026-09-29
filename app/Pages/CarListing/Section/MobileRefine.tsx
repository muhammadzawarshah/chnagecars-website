"use client"

import { useEffect, useState } from "react"
import { CarSearch } from "@/app/lib/cars/search"
import RefineSearch from "./RefineSearch"

// Below 1039px the sidebar is hidden; this button slides the same form down from the top.
export default function MobileRefine({ search, inventory }: { search: CarSearch, inventory: number }) {

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [open]);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border-0 bg-ink px-4 font-sans text-sm font-medium text-white min-[1039px]:hidden">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"><path d="M2 4h12M4 8h8M6 12h4" /></svg>
                Refine search
            </button>
            <div className={`fixed inset-x-0 top-0 z-100 max-h-full overflow-y-auto bg-[#212121] px-8.75 pt-17.5 pb-6.25 transition-all duration-300 min-[1039px]:hidden ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"}`}>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="absolute top-5 right-5 flex size-9 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.6"><path d="M1 1l10 10M11 1L1 11" /></svg>
                </button>
                <RefineSearch key={JSON.stringify(search)} search={search} inventory={inventory} onDone={() => setOpen(false)} />
            </div>
        </>
    )
}
