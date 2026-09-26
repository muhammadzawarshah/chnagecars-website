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
    const row = "group/row block cursor-pointer px-3.75 transition-colors duration-100 hover:bg-muted";
    const text = "flex cursor-pointer items-center py-2.5 text-[13px] text-text-dark group-hover/row:text-white max-[676px]:text-[15px]";
    const box = "mr-2 size-4.5 shrink-0 rounded-[3px] border bg-size-[73%] bg-center bg-no-repeat";

    return (
        <>
            <div className="relative w-full">
                <div onClick={onToggle} className="relative h-10 w-full cursor-pointer overflow-hidden rounded-t-[3px] border-b border-white bg-[#282828] px-3.25 text-sm leading-10 font-normal text-ellipsis whitespace-nowrap text-white after:absolute after:top-1/2 after:right-4.25 after:block after:-translate-y-1/2 after:border-x-4 after:border-t-6 after:border-x-transparent after:border-t-white after:content-[''] max-[676px]:text-base">
                    {label}
                </div>
                {open && (
                    <div className="absolute right-0 bottom-0 z-50 min-h-67.75 w-full overflow-hidden rounded bg-panel">
                        <a onClick={onToggle} className="absolute top-0 right-0 z-1 block h-9.75 w-10 cursor-pointer transition duration-200 after:absolute after:top-4.25 after:right-3.5 after:block after:border-x-6 after:border-t-7 after:border-x-transparent after:border-t-white after:content-[''] hover:scale-110"></a>
                        <a onClick={() => { onChange([]); setQuery(""); }} className="absolute top-0 right-11.25 z-1 block h-9.75 w-7.5 cursor-pointer bg-[url(/img/refresh.svg)] bg-size-[20px_20px] bg-center bg-no-repeat transition duration-200 hover:scale-110"></a>
                        <div className="overflow-hidden border-b border-muted bg-muted bg-[url(/img/magnifying-glass-white.svg)] bg-size-[15px] bg-position-[left_17px_top_13px] bg-no-repeat pt-2 pr-18.5 pb-1.75 pl-11.25">
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Quick Search"
                                className="float-left mr-2.5 h-6.25 w-[95%] border-0 bg-transparent text-sm text-white outline-none placeholder:text-white"
                            />
                        </div>
                        <div className="max-h-57.75 overflow-y-scroll">
                            <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                                {!query && (
                                    <li onClick={() => onChange([])} className={row}>
                                        <label className={`${text} ${selected.length === 0 ? "font-bold" : ""}`}>
                                            <span className={`${box} ${selected.length === 0 ? "border-text-dark bg-text-dark bg-[url(/img/check.svg)]" : "border-[#7c7c7c] group-hover/row:border-white"}`}></span>
                                            <p className="m-0">Any</p>
                                        </label>
                                    </li>
                                )}
                                {filtered.map((dealer) => {
                                    const checked = selected.includes(dealer.name);
                                    return (
                                        <li key={dealer.slug} onClick={() => select(dealer.name)} className={row}>
                                            <label className={`${text} ${checked ? "font-bold" : ""}`}>
                                                <span className={`${box} ${checked ? "border-text-dark bg-text-dark bg-[url(/img/check.svg)]" : "border-[#7c7c7c] group-hover/row:border-white"}`}></span>
                                                <p className="m-0">{dealer.name}</p>
                                            </label>
                                        </li>
                                    )
                                })}
                            </ul>
                            {filtered.length === 0 && <div className="p-2.5 text-center text-text-dark">No results found</div>}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
