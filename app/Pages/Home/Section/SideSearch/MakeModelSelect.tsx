"use client"

import { useState } from "react"
import { makes } from "../../Data/makes"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import CircleCheck from "../AppSearch/CircleCheck"
import ExpandLink from "../AppSearch/ExpandLink"

type MakeModelSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
    onClose: () => void
}

export default function MakeModelSelect({ selected, onChange, onClose }: MakeModelSelectProps) {

    const { t } = useLanguage();
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    function toggleOpen(key: string) {
        setOpenKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    }

    function toggleSelect(key: string) {
        if (selected.includes(key)) {
            onChange(selected.filter((item) => item !== key));
            return;
        }
        onChange([...selected.filter((item) => !item.startsWith(`${key}|`) && !key.startsWith(`${item}|`)), key]);
    }

    return (
        <div className="absolute top-full right-0 z-46 mt-px max-h-90 w-full overflow-hidden rounded-b bg-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="relative flex h-8 items-center justify-end gap-2 border-b border-[#e5e1d8] px-2">
                <button onClick={() => { onChange([]); setOpenKeys([]); }} aria-label={t.clear} className="flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                    <img src="/img/refresh.svg" alt="" className="size-4" />
                </button>
                <button onClick={onClose} aria-label="Close" className="flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#777" strokeWidth="1.5"><path d="M1 1l10 10M11 1L1 11" /></svg>
                </button>
            </div>
            <div className="max-h-62.5 overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                <ul className="m-0 list-none p-0">
                    {makes.map((make) => {
                        const makeKey = make.name;
                        const makeOpen = openKeys.includes(makeKey);
                        return (
                            <li key={make.slug + make.count}>
                                <div onClick={() => toggleSelect(makeKey)} className="flex h-12 cursor-pointer items-center pl-5">
                                    <CircleCheck checked={selected.includes(makeKey)} />
                                    <span className="ml-3 text-[16.6px] font-bold text-black">{make.name}</span>
                                    <span className="ml-2.25 text-[16.6px] text-[#757575]">({make.count})</span>
                                    <ExpandLink label={t.models} open={makeOpen} onToggle={() => toggleOpen(makeKey)} />
                                </div>
                                {makeOpen && (
                                    <ul className="m-0 list-none p-0">
                                        <li onClick={() => toggleSelect(makeKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                            <CircleCheck checked={selected.includes(makeKey)} />
                                            <span className="ml-3 text-[16.6px] font-bold text-black">{t.all}</span>
                                        </li>
                                        {make.models.map((model) => {
                                            const modelKey = `${makeKey}|${model.name}`;
                                            const modelOpen = openKeys.includes(modelKey);
                                            return (
                                                <li key={model.slug + model.count}>
                                                    <div onClick={() => toggleSelect(modelKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                                        <CircleCheck checked={selected.includes(modelKey) || selected.includes(makeKey)} />
                                                        <span className="ml-3 text-[16.6px] text-black">{model.name}</span>
                                                        <span className="ml-2.25 text-[16.6px] text-[#757575]">({model.count})</span>
                                                        {model.variants.length > 0 && <ExpandLink label={t.variants} open={modelOpen} onToggle={() => toggleOpen(modelKey)} />}
                                                    </div>
                                                    {modelOpen && (
                                                        <ul className="m-0 list-none p-0">
                                                            {model.variants.map((variant) => {
                                                                const variantKey = `${modelKey}|${variant}`;
                                                                return (
                                                                    <li key={variant} onClick={() => toggleSelect(variantKey)} className="flex h-10 cursor-pointer items-center pl-21">
                                                                        <CircleCheck checked={selected.includes(variantKey) || selected.includes(modelKey) || selected.includes(makeKey)} />
                                                                        <span className="ml-3 text-[16.6px] text-black">{variant}</span>
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
            </div>
        </div>
    )
}
