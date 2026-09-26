"use client"

import { useState } from "react"
import { searchProvinces } from "../../Data/search"

type ProvinceSelectProps = {
    selected: string | null
    onSelect: (value: string | null) => void
    onClose: () => void
}

export default function ProvinceSelect({ selected, onSelect, onClose }: ProvinceSelectProps) {

    const [query, setQuery] = useState("");

    const filtered = searchProvinces.filter((province) => province.name.toLowerCase().includes(query.trim().toLowerCase()));
    const item = "block cursor-pointer px-3.75 py-1.25 text-[13px] leading-8 text-text-dark transition-colors duration-100 hover:bg-muted hover:text-white max-[676px]:text-[15px]";

    return (
        <>
            <div className="absolute right-0 bottom-0 z-47 w-full overflow-hidden rounded-t bg-panel">
                <div className="max-h-45 overflow-y-scroll rounded-b">
                    <ul className="m-0 block p-0">
                        {!query && (
                            <li onClick={() => onSelect(null)} className={`${item} ${selected === null ? "bg-muted text-white" : ""}`}>All Provinces</li>
                        )}
                        {filtered.map((province) => (
                            <li key={province.name} onClick={() => onSelect(province.name)} className={`${item} ${selected === province.name ? "bg-muted text-white" : ""}`}>
                                {province.name} (<span>{province.count}</span>)
                            </li>
                        ))}
                    </ul>
                </div>
                <a
                    onClick={() => {
                        navigator.geolocation?.getCurrentPosition(() => onClose(), () => onClose());
                    }}
                    className="block h-8.25 cursor-pointer border-b border-panel bg-[url(/img/location-icon-black.svg)] bg-position-[left_12px_center] bg-no-repeat pl-9.5 text-sm leading-8 text-text-dark"
                >
                    Use my location
                </a>
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search location"
                    className="block h-10 w-full rounded-none border-0 bg-muted bg-[url(/img/magnifying-glass-white.svg)] bg-size-[12px] bg-position-[left_15px_top_15px] bg-no-repeat pr-7.5 pl-9.5 text-sm text-white outline-none placeholder:text-white"
                />
                <a onClick={onClose} className="absolute right-2.25 bottom-3 block size-4 cursor-pointer bg-[url(/img/close.svg)] bg-size-[10px_16px] bg-no-repeat transition duration-200 hover:scale-110"></a>
            </div>
        </>
    )
}
