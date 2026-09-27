"use client"

import { useState } from "react"

export type MenuItem = {
    id: string
    label: string
    selected: boolean
    onSelect: () => void
}

type OptionMenuProps = {
    items: MenuItem[]
    info?: string
    searchPlaceholder?: string
}

export default function OptionMenu({ items, info, searchPlaceholder }: OptionMenuProps) {

    const [query, setQuery] = useState("");

    const search = query.trim().toLowerCase();
    const visible = search ? items.filter((item) => item.label.toLowerCase().includes(search)) : items;

    return (
        <>
            <div className="absolute top-full z-46 mt-px max-h-62.5 w-full overflow-y-auto rounded-b bg-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                {searchPlaceholder && (
                    <div className="sticky top-0 z-1 bg-white p-1.5 pb-0">
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-8 w-full rounded border border-[#bdbdbd] px-2.5 text-[13px] text-[#171717] outline-none placeholder:text-[#8c8c8c] focus:border-[#957e4e]"
                        />
                    </div>
                )}
                {info && <p className="m-0 px-4 pt-2 text-xs text-[#8c8c8c]">{info}</p>}
                <ul className="m-0 list-none p-1.5">
                    {visible.map((item) => (
                        <li
                            key={item.id}
                            onClick={item.onSelect}
                            className={`flex h-7.5 cursor-pointer items-center justify-between rounded px-2.5 text-[13px] ${item.selected ? "bg-[#eee8dc] font-semibold text-[#957e4d]" : "text-[#171717] hover:bg-[#f5f2ed]"}`}
                        >
                            <span className="truncate">{item.label}</span>
                            {item.selected && <svg width="13" height="10" viewBox="0 0 18 14" fill="none" stroke="#9d885c" strokeWidth="2" className="shrink-0"><path d="M1 7l5 5L17 1" /></svg>}
                        </li>
                    ))}
                </ul>
                {visible.length === 0 && <p className="m-0 px-4 pb-3 text-center text-[13px] text-[#8c8c8c]">No results found</p>}
            </div>
        </>
    )
}
