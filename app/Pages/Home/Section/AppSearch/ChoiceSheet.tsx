"use client"

import { useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import BottomSheet from "./BottomSheet"
import SheetFooter from "./SheetFooter"
import CircleCheck from "./CircleCheck"

type ChoiceSheetProps = {
    title: string
    options: string[]
    selected: string[]
    multiple?: boolean
    info?: string
    searchable?: boolean
    onApply: (selected: string[]) => void
    onClose: () => void
}

export default function ChoiceSheet({ title, options, selected, multiple = false, info, searchable = false, onApply, onClose }: ChoiceSheetProps) {

    const { t } = useLanguage();
    const [draft, setDraft] = useState(selected);
    const [query, setQuery] = useState("");

    const search = query.trim().toLowerCase();
    const visible = search ? options.filter((option) => option.toLowerCase().includes(search)) : options;

    function toggle(name: string) {
        if (!multiple) {
            setDraft((current) => current.includes(name) ? [] : [name]);
            return;
        }
        setDraft((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    }

    return (
        <>
            <BottomSheet
                title={title}
                onClose={onClose}
                footer={<SheetFooter applyLabel={t.applyFilters} clearLabel={t.clear} onApply={() => onApply(draft)} onClear={() => onApply([])} />}
            >
                {searchable && (
                    <div className="sticky top-0 z-1 bg-white px-5 pt-1 pb-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${title}`}
                            className="h-10 w-full rounded border border-[#bdbdbd] px-3 text-[15px] text-black outline-none placeholder:text-[#8c8c8c] focus:border-[#957e4e]"
                        />
                    </div>
                )}
                {info && <p className="m-0 px-5 pb-1 text-sm text-[#757575]">{info}</p>}
                <ul className="m-0 list-none p-0">
                    {!search && (
                        <li onClick={() => setDraft([])} className="flex h-12 cursor-pointer items-center pl-5">
                            <CircleCheck checked={draft.length === 0} />
                            <span className={`ml-[12.67px] text-[16.8px] ${draft.length === 0 ? "text-[#957e4e]" : "text-black"}`}>{t.any}</span>
                        </li>
                    )}
                    {visible.map((option) => (
                        <li key={option} onClick={() => toggle(option)} className="flex h-12 cursor-pointer items-center pl-5">
                            <CircleCheck checked={draft.includes(option)} />
                            <span className={`ml-[12.67px] text-[15.2px] ${draft.includes(option) ? "text-[#957e4e]" : "text-black"}`}>{option}</span>
                        </li>
                    ))}
                </ul>
                {visible.length === 0 && <p className="m-0 px-5 py-3 text-center text-[15px] text-[#757575]">No results found</p>}
            </BottomSheet>
        </>
    )
}
