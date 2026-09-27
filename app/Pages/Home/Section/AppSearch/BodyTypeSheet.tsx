"use client"

import { useState } from "react"
import { bodyTypes } from "../../Data/search"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import BottomSheet from "./BottomSheet"
import SheetFooter from "./SheetFooter"
import CircleCheck from "./CircleCheck"

type BodyTypeSheetProps = {
    selected: string[]
    onApply: (selected: string[]) => void
    onClose: () => void
}

export default function BodyTypeSheet({ selected, onApply, onClose }: BodyTypeSheetProps) {

    const { t } = useLanguage();
    const [draft, setDraft] = useState(selected);

    function toggle(name: string) {
        setDraft((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    }

    return (
        <>
            <BottomSheet
                title={t.bodyTypesTitle}
                onClose={onClose}
                footer={<SheetFooter applyLabel={t.applyFilters} clearLabel={t.clear} onApply={() => onApply(draft)} onClear={() => onApply([])} />}
            >
                <ul className="m-0 list-none p-0">
                    <li onClick={() => setDraft([])} className="flex h-12 cursor-pointer items-center pl-5">
                        <CircleCheck checked={draft.length === 0} />
                        <span className={`ml-[12.67px] text-[16.8px] ${draft.length === 0 ? "text-[#957e4e]" : "text-black"}`}>{t.any}</span>
                    </li>
                    {bodyTypes.map((type) => (
                        <li key={type.name} onClick={() => toggle(type.name)} className="flex h-12 cursor-pointer items-center pl-5">
                            <CircleCheck checked={draft.includes(type.name)} />
                            <span className={`ml-[12.67px] text-[15.2px] ${draft.includes(type.name) ? "text-[#957e4e]" : "text-black"}`}>{type.name}</span>
                            <span className="ml-2.25 text-[15.2px] text-[#757575]">({type.count})</span>
                        </li>
                    ))}
                </ul>
            </BottomSheet>
        </>
    )
}
