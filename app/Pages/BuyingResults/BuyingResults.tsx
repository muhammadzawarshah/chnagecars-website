"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car } from "@/app/lib/cars/types"
import { SortKey, sortOptions } from "@/app/lib/cars/search"
import BottomSheet from "../Home/Section/AppSearch/BottomSheet"
import ResultCard from "./Section/ResultCard"

type BuyingResultsProps = {
    cars: Car[]
    sort: SortKey
    page: number
    pageCount: number
    total: number
    // Current filters as a query string, kept when the sort changes.
    query: string
    // This screen's address (without query) and the address its Filters button opens.
    resultsPath: string
    filtersPath: string
}

// Copies the app's "Search" results screen (Buying links, brand cards).
export default function BuyingResults({ cars, sort, page, pageCount, total, query, resultsPath, filtersPath }: BuyingResultsProps) {

    const router = useRouter();
    const [text, setText] = useState(() => new URLSearchParams(query).get("q") ?? "");
    const [sorting, setSorting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(query);
        const current = params.get("q") ?? "";
        const next = text.trim();
        if (current === next) return;
        const timer = window.setTimeout(() => {
            params.delete("page");
            if (next) params.set("q", next);
            else params.delete("q");
            const value = params.toString();
            router.replace(value ? `${resultsPath}?${value}` : resultsPath);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [text, query, resultsPath, router]);

    function back() {
        if (window.history.length > 1) router.back();
        else router.push("/");
    }

    function pickSort(value: SortKey) {
        const params = new URLSearchParams(query);
        params.delete("page");
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        setSorting(false);
        const next = params.toString();
        router.push(next ? `${resultsPath}?${next}` : resultsPath);
    }

    function pageHref(target: number) {
        const params = new URLSearchParams(query);
        if (target <= 1) params.delete("page");
        else params.set("page", String(target));
        const next = params.toString();
        return next ? `${resultsPath}?${next}` : resultsPath;
    }

    return (
        <>
            <main className="min-h-svh bg-white font-roboto max-[981px]:-mt-14 min-[982px]:max-[1111px]:pt-15">
                <div className="sticky top-0 z-20 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06)] max-[981px]:top-0 min-[982px]:static">
                    <div className="mx-auto w-full max-w-150 min-[982px]:max-w-300 min-[982px]:px-5 min-[982px]:pt-6 min-[982px]:pb-5">
                        <div className="relative flex h-14.5 items-center px-4.75 min-[982px]:h-auto min-[982px]:px-0 min-[982px]:pb-5">
                            <button onClick={back} aria-label="Back" className="flex size-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 min-[982px]:hidden">
                                <svg width="17" height="15" viewBox="0 0 18 15" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 7.5H1.5M7.5 1.2L1.2 7.5l6.3 6.3" />
                                </svg>
                            </button>
                            <h1 className="m-0 ml-7.5 text-sm font-medium text-black min-[982px]:ml-0 min-[982px]:text-[28px] min-[982px]:font-normal">Search</h1>
                            <button onClick={() => setSorting(true)} className="ml-auto flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-[#957e4e] min-[982px]:text-base">
                                Sort by
                                <svg width="13" height="12" viewBox="0 0 13 12" fill="none" stroke="#957e4e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3.5 11V1M1 3.5L3.5 1 6 3.5M9.5 1v10M7 8.5L9.5 11 12 8.5" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex gap-2.25 px-4.75 pb-2.25 min-[982px]:gap-4 min-[982px]:px-0 min-[982px]:pb-0">
                            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-lg min-[982px]:h-13 min-[982px]:px-4 border border-[#eeeeee] bg-white px-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#9e9e9e" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
                                    <circle cx="6.8" cy="6.8" r="5.3" />
                                    <path d="M10.8 10.8L15 15" />
                                </svg>
                                <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Find Your Next Car" className="h-full min-w-0 flex-1 border-0 bg-transparent text-[12.5px] tracking-[0.3px] min-[982px]:text-base text-black outline-none placeholder:text-[#9e9e9e]" />
                            </label>
                            <Link href={filtersPath} className="flex h-11.75 w-27.75 shrink-0 items-center justify-center gap-2.5 self-center rounded-md min-[982px]:h-13 min-[982px]:w-40 min-[982px]:transition min-[982px]:hover:bg-[#957e4e] min-[982px]:hover:text-white min-[982px]:[&:hover_svg]:stroke-white border border-[#957e4e] text-[15px] text-[#957e4e] no-underline">
                                <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#957e4e" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M1 1h14M3.5 5.5h9M6 10h4" />
                                </svg>
                                Filters
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-150 flex-col gap-5 px-5.25 pt-6 pb-15 min-[982px]:grid min-[982px]:max-w-300 min-[982px]:grid-cols-2 min-[982px]:gap-6 min-[982px]:px-5 min-[982px]:pt-8 min-[1200px]:grid-cols-3">
                    {cars.map((car) => <ResultCard key={car.id} car={car} />)}
                    {cars.length === 0 && (
                        <div className="py-15 text-center min-[982px]:col-span-full">
                            <p className="m-0 text-base font-medium text-black">No vehicles found</p>
                            <p className="mt-2 mb-0 text-sm text-[#757575]">Try changing your filters.</p>
                            <Link href={filtersPath} className="mx-auto mt-5 flex h-10 w-40 items-center justify-center rounded-md bg-[#957e4e] text-sm text-white no-underline">Change filters</Link>
                        </div>
                    )}
                </div>
                {pageCount > 1 && (
                    <nav aria-label="Search result pages">
                        {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
                        <span> Page {page} of {pageCount} ({total} vehicles) </span>
                        {page < pageCount && <Link href={pageHref(page + 1)}>Next</Link>}
                    </nav>
                )}
            </main>

            {sorting && (
                <BottomSheet title="Sort by" onClose={() => setSorting(false)}>
                    {sortOptions.map((option) => (
                        <button key={option.value} onClick={() => pickSort(option.value)} className={`flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-5 py-3.5 text-left text-[15px] ${option.value === sort ? "font-bold text-[#957e4e]" : "text-black"}`}>
                            {option.label}
                            {option.value === sort && (
                                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#957e4e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 6.5l4 4 9-9" /></svg>
                            )}
                        </button>
                    ))}
                </BottomSheet>
            )}
        </>
    )
}
