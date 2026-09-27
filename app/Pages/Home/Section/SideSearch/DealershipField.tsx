"use client"

import { useState } from "react"
import { dealerships } from "../../Data/dealerships"

type DealershipFieldProps = {
    selected: string[]
    open: boolean
    onToggle: () => void
    onChange: (selected: string[]) => void
}

export default function DealershipField({ selected, open, onToggle, onChange }: DealershipFieldProps) {

    const [query, setQuery] = useState("");

    const filtered = dealerships.filter((dealer) => dealer.name.toLowerCase().includes(query.trim().toLowerCase()));

    function select(name: string) {
        onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
    }

    const label = selected.length === 0 ? "Dealership Name" : selected.length === 1 ? selected[0] : `${selected[0]} + ${selected.length - 1} More`;
    const row = "group/row block cursor-pointer px-3.75 transition-colors duration-100 hover:bg-[#f5f5f5]";
    const text = "flex cursor-pointer items-center py-2.5 text-[13px] max-[676px]:text-[15px]";
    const box = "mr-2 size-4.5 shrink-0 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat";

    return (
        <>
            <div className="relative w-full">
                <div onClick={onToggle} className={`relative h-10 w-full cursor-pointer overflow-hidden rounded-[5px] border border-[#e8e8e8] bg-white px-3.75 text-sm leading-9.5 font-normal text-ellipsis whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.08)] after:absolute after:top-1/2 after:right-4.25 after:block after:-translate-y-1/2 after:border-x-4 after:border-t-6 after:border-x-transparent after:border-t-[#8c8c8c] after:content-[''] max-[676px]:text-base ${selected.length ? "text-[#333]" : "text-[#8c8c8c]"}`}>
                    {label}
                </div>
                {open && (
                    <div className="absolute right-0 bottom-0 z-50 min-h-67.75 w-full overflow-hidden rounded-[5px] border border-[#e8e8e8] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
                        <a onClick={onToggle} className="absolute top-0 right-0 z-1 block h-9.75 w-10 cursor-pointer transition duration-200 after:absolute after:top-4.25 after:right-3.5 after:block after:border-x-6 after:border-t-7 after:border-x-transparent after:border-t-white after:content-[''] hover:scale-110"></a>
                        <a onClick={() => { onChange([]); setQuery(""); }} className="absolute top-0 right-11.25 z-1 block h-9.75 w-7.5 cursor-pointer bg-[url(/img/refresh.svg)] bg-size-[20px_20px] bg-center bg-no-repeat transition duration-200 hover:scale-110"></a>
                        <div className="overflow-hidden border-b border-[#957e4e] bg-[#957e4e] bg-[url(/img/magnifying-glass-white.svg)] bg-size-[15px] bg-position-[left_17px_top_13px] bg-no-repeat pt-2 pr-18.5 pb-1.75 pl-11.25">
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Quick Search E.G. Fortuner/GTI"
                                className="float-left mr-2.5 h-6.25 w-[95%] border-0 bg-transparent text-sm text-white outline-none placeholder:text-white"
                            />
                        </div>
                        <div className="max-h-57.75 overflow-y-scroll">
                            <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                                {!query && (
                                    <li onClick={() => onChange([])} className={row}>
                                        <label className={`${text} ${selected.length === 0 ? "font-bold text-[#957e4e]" : "text-black"}`}>
                                            <span className={`${box} ${selected.length === 0 ? "border-[#957e4e] bg-[#957e4e] bg-[url(/img/check.svg)]" : "border-[#b5b5b5]"}`}></span>
                                            <p className="m-0">Any</p>
                                        </label>
                                    </li>
                                )}
                                {filtered.map((dealer) => {
                                    const checked = selected.includes(dealer.name);
                                    return (
                                        <li key={dealer.slug} onClick={() => select(dealer.name)} className={row}>
                                            <label className={`${text} ${checked ? "font-bold text-[#957e4e]" : "text-black"}`}>
                                                <span className={`${box} ${checked ? "border-[#957e4e] bg-[#957e4e] bg-[url(/img/check.svg)]" : "border-[#b5b5b5]"}`}></span>
                                                <p className="m-0">{dealer.name}</p>
                                            </label>
                                        </li>
                                    )
                                })}
                            </ul>
                            {filtered.length === 0 && <div className="p-2.5 text-center text-black">No results found</div>}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
