"use client"

import { useEffect, useRef } from "react"
import { AppOption } from "../../Data/appSearch"
import BottomSheet from "./BottomSheet"

type OptionSheetProps = {
    title: string
    options: AppOption[]
    selected: number | null
    fallback: number
    onSelect: (value: number) => void
    onClose: () => void
}

export default function OptionSheet({ title, options, selected, fallback, onSelect, onClose }: OptionSheetProps) {

    const active = selected ?? fallback;
    const activeRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest" });
    }, []);

    return (
        <>
            <BottomSheet title={title} onClose={onClose}>
                <ul className="m-0 list-none p-0">
                    {options.map((option) => (
                        <li
                            key={option.value}
                            ref={option.value === active ? activeRef : undefined}
                            onClick={() => onSelect(option.value)}
                            className={`flex h-10.5 cursor-pointer items-center justify-between pr-[21.33px] pl-5 text-[17.2px] ${option.value === active ? "font-bold text-[#957e4e]" : "text-black"}`}
                        >
                            {option.label}
                            {option.value === active && (
                                <svg width="14" height="10.9" viewBox="0 0 18 14" fill="none" stroke="#957e4e" strokeWidth="1.6">
                                    <path d="M1 7.2l5.4 5.4L17 1.4" />
                                </svg>
                            )}
                        </li>
                    ))}
                </ul>
            </BottomSheet>
        </>
    )
}
