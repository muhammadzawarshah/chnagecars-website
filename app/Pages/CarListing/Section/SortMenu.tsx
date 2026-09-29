"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { CarSearch, carSearchHref, sortOptions } from "@/app/lib/cars/search"

export default function SortMenu({ search }: { search: CarSearch }) {

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = sortOptions.find((option) => option.value === (search.sort ?? "recent")) ?? sortOptions[0];

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <>
            <div ref={ref} className="relative shrink-0">
                <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="cursor-pointer rounded-full border-0 bg-gold p-2.5 font-sans text-sm leading-4.25 font-medium whitespace-nowrap text-white">
                    Sort by: <span className="underline">{current.label}</span>
                </button>
                {open && (
                    <div className="absolute top-full right-0 z-20 mt-1 min-w-full rounded border border-[#7c7c7c] bg-white">
                        <span className="block h-9.25 border-b border-[#7c7c7c] px-2.75 text-sm leading-9 font-medium text-[#a39161]">Sort by</span>
                        <ul className="my-2.5 list-none p-0">
                            {sortOptions.map((option) => (
                                <li key={option.value}>
                                    <Link
                                        href={carSearchHref({ ...search, sort: option.value, page: undefined })}
                                        onClick={() => setOpen(false)}
                                        className={`block h-6.5 px-2.75 text-sm leading-6.5 whitespace-nowrap text-[#a39161] no-underline hover:bg-[rgba(111,111,111,0.5)] ${option.value === current.value ? "bg-[rgba(159,126,77,0.2)]" : ""}`}
                                    >
                                        {option.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
