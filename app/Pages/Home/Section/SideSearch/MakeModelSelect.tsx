"use client"

import { useState } from "react"
import { makes } from "../../Data/makes"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import CircleCheck from "../AppSearch/CircleCheck"
import ExpandLink from "../AppSearch/ExpandLink"

type MakeModelSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
}

export default function MakeModelSelect({ selected, onChange }: MakeModelSelectProps) {

    const { t } = useLanguage();
    const [query, setQuery] = useState("");
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const search = query.trim().toLowerCase();

    const filtered = makes
        .map((make) => {
            if (!search || make.name.toLowerCase().includes(search)) return make;
            const models = make.models.filter((model) =>
                `${make.name} ${model.name}`.toLowerCase().includes(search) ||
                model.variants.some((variant) => `${make.name} ${model.name} ${variant}`.toLowerCase().includes(search))
            );
            return models.length ? { ...make, models } : null;
        })
        .filter((make) => make !== null);

    function isOpen(key: string) {
        return openKeys.includes(key) || (search.length > 1 && !key.includes("|"));
    }

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
            <div className="p-1.5 pb-0">
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Quick Search E.G. Fortuner/GTI"
                    className="h-8 w-full rounded border border-[#bdbdbd] px-2.5 text-[13px] text-[#171717] outline-none placeholder:text-[#8c8c8c] focus:border-[#957e4e]"
                />
            </div>
            <div className="max-h-62.5 overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                <ul className="m-0 list-none p-0">
                    {filtered.map((make) => {
                        const makeKey = make.name;
                        const makeOpen = isOpen(makeKey);
                        return (
                            <li key={make.slug + make.count}>
                                <div onClick={() => toggleSelect(makeKey)} className="flex h-12 cursor-pointer items-center pl-5">
                                    <CircleCheck checked={selected.includes(makeKey)} />
                                    <span className="ml-3 text-[13px] text-black">{make.name}</span>
                                    <span className="ml-2.25 text-[13px] text-[#757575]">({make.count})</span>
                                    <ExpandLink textClass="text-[13px]" label={t.models} open={makeOpen} onToggle={() => toggleOpen(makeKey)} />
                                </div>
                                {makeOpen && (
                                    <ul className="m-0 list-none p-0">
                                        <li onClick={() => toggleSelect(makeKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                            <CircleCheck checked={selected.includes(makeKey)} />
                                            <span className="ml-3 text-[13px] text-black">{t.all}</span>
                                        </li>
                                        {make.models.map((model) => {
                                            const modelKey = `${makeKey}|${model.name}`;
                                            const modelOpen = isOpen(modelKey);
                                            return (
                                                <li key={model.slug + model.count}>
                                                    <div onClick={() => toggleSelect(modelKey)} className="flex h-10 cursor-pointer items-center pl-13">
                                                        <CircleCheck checked={selected.includes(modelKey) || selected.includes(makeKey)} />
                                                        <span className="ml-3 text-[13px] text-black">{model.name}</span>
                                                        <span className="ml-2.25 text-[13px] text-[#757575]">({model.count})</span>
                                                        {model.variants.length > 0 && <ExpandLink textClass="text-[13px]" label={t.variants} open={modelOpen} onToggle={() => toggleOpen(modelKey)} />}
                                                    </div>
                                                    {modelOpen && (
                                                        <ul className="m-0 list-none p-0">
                                                            {model.variants.map((variant) => {
                                                                const variantKey = `${modelKey}|${variant}`;
                                                                return (
                                                                    <li key={variant} onClick={() => toggleSelect(variantKey)} className="flex h-10 cursor-pointer items-center pl-21">
                                                                        <CircleCheck checked={selected.includes(variantKey) || selected.includes(modelKey) || selected.includes(makeKey)} />
                                                                        <span className="ml-3 text-[13px] text-black">{variant}</span>
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
                {filtered.length === 0 && <p className="m-0 px-4 pb-3 text-center text-[13px] text-[#8c8c8c]">No results found</p>}
            </div>
        </div>
    )
}
