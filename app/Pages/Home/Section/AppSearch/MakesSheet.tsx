"use client"

import { useState } from "react"
import { makes } from "../../Data/makes"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import BottomSheet from "./BottomSheet"
import SheetFooter from "./SheetFooter"
import CircleCheck from "./CircleCheck"
import ExpandLink from "./ExpandLink"

type MakesSheetProps = {
    selected: string[]
    onApply: (selected: string[]) => void
    onClose: () => void
}

export default function MakesSheet({ selected, onApply, onClose }: MakesSheetProps) {

    const { t } = useLanguage();
    const [draft, setDraft] = useState(selected);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    function toggleOpen(key: string) {
        setOpenKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    }

    function toggleSelect(key: string) {
        setDraft((current) => current.includes(key)
            ? current.filter((item) => item !== key)
            : [...current.filter((item) => !item.startsWith(`${key}|`) && !key.startsWith(`${item}|`)), key]);
    }

    return (
        <>
            <BottomSheet
                title={t.makesTitle}
                onClose={onClose}
                footer={<SheetFooter applyLabel={t.applyFilters} clearLabel={t.clear} onApply={() => onApply(draft)} onClear={() => onApply([])} />}
            >
                <ul className="m-0 list-none p-0">
                    {makes.map((make) => {
                        const makeKey = make.name;
                        const makeOpen = openKeys.includes(makeKey);
                        return (
                            <li key={make.slug + make.count}>
                                <div onClick={() => toggleSelect(makeKey)} className="flex h-12 cursor-pointer items-center pl-5">
                                    <CircleCheck checked={draft.includes(makeKey)} />
                                    <span className="ml-[12.67px] text-[16.6px] font-bold text-black">{make.name}</span>
                                    <span className="ml-2.25 text-[16.6px] text-[#757575]">({make.count})</span>
                                    <ExpandLink label={t.models} open={makeOpen} onToggle={() => toggleOpen(makeKey)} />
                                </div>
                                {makeOpen && (
                                    <ul className="m-0 list-none p-0">
                                        <li onClick={() => toggleSelect(makeKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                            <CircleCheck checked={draft.includes(makeKey)} />
                                            <span className="ml-[12.67px] text-[16.6px] font-bold text-black">{t.all}</span>
                                        </li>
                                        {make.models.map((model) => {
                                            const modelKey = `${makeKey}|${model.name}`;
                                            const modelOpen = openKeys.includes(modelKey);
                                            return (
                                                <li key={model.slug + model.count}>
                                                    <div onClick={() => toggleSelect(modelKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                                        <CircleCheck checked={draft.includes(modelKey) || draft.includes(makeKey)} />
                                                        <span className="ml-[12.67px] text-[16.6px] text-black">{model.name}</span>
                                                        <span className="ml-2.25 text-[16.6px] text-[#757575]">({model.count})</span>
                                                        {model.variants.length > 0 && <ExpandLink label={t.variants} open={modelOpen} onToggle={() => toggleOpen(modelKey)} />}
                                                    </div>
                                                    {modelOpen && (
                                                        <ul className="m-0 list-none p-0">
                                                            {model.variants.map((variant) => {
                                                                const variantKey = `${modelKey}|${variant}`;
                                                                return (
                                                                    <li key={variant} onClick={() => toggleSelect(variantKey)} className="flex h-10 cursor-pointer items-center pl-21">
                                                                        <CircleCheck checked={draft.includes(variantKey) || draft.includes(modelKey) || draft.includes(makeKey)} />
                                                                        <span className="ml-[12.67px] text-[16.6px] text-black">{variant}</span>
                                                                    </li>
                                                                )
                                                            })}
                                                        </ul>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </BottomSheet>
        </>
    )
}
