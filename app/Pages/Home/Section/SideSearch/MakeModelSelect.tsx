"use client"

import { useState } from "react"
import { makes } from "../../Data/makes"
import TreeRow from "./TreeRow"
import { useLanguage } from "../../../../components/Language/LanguageContext"

type MakeModelSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
    onClose: () => void
}

export default function MakeModelSelect({ selected, onChange, onClose }: MakeModelSelectProps) {

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
        setOpenKeys(openKeys.includes(key) ? openKeys.filter((item) => item !== key) : [...openKeys, key]);
    }

    function toggleSelect(key: string) {
        if (selected.includes(key)) {
            onChange(selected.filter((item) => item !== key));
            return;
        }
        onChange([...selected.filter((item) => !item.startsWith(`${key}|`) && !key.startsWith(`${item}|`)), key]);
    }

    function hasChild(key: string) {
        return selected.some((item) => item.startsWith(`${key}|`));
    }

    return (
        <>
            <div className="absolute top-full right-0 z-46 mt-px min-h-90 w-full overflow-hidden rounded-b bg-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                <div className="border-b border-[#e5e1d8] px-3.75 py-2.5 text-[15px] font-bold text-[#171717]">{t.makesTitle}</div>
                <a onClick={onClose} className="absolute top-0 right-4.25 z-1 block h-9.75 w-10 cursor-pointer transition duration-200 after:absolute after:top-4.5 after:right-3.5 after:block after:border-x-6 after:border-t-7 after:border-x-transparent after:border-t-[#777] after:content-[''] hover:scale-110"></a>
                <a onClick={() => { onChange([]); setQuery(""); setOpenKeys([]); }} className="absolute top-0 right-13.75 z-1 block h-9.75 w-7.5 cursor-pointer bg-[url(/img/refresh.svg)] bg-size-[20px_20px] bg-center bg-no-repeat transition duration-200 hover:scale-110"></a>
                <div className="overflow-hidden border-b border-[#e5e1d8] bg-white pt-2 pr-8.75 pb-1.75 pl-5">
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Quick Search E.G. Fortuner/GTI"
                        className="float-left mr-2.5 h-6 w-[95%] border-0 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#777]"
                    />
                </div>
                <div className="max-h-62.5 overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                    <ul className="m-0 block list-none px-0 pt-1.25 pb-0">
                        {!search && (
                            <li>
                                <TreeRow label={t.any} checked={selected.length === 0} indent="pl-2.5" rowClass="cursor-pointer" onSelect={() => onChange([])} />
                            </li>
                        )}
                        {filtered.map((make) => {
                            const makeKey = make.name;
                            const makeOpen = isOpen(makeKey);
                            return (
                                <li key={make.slug + make.count}>
                                    <TreeRow
                                        label={`${make.name} (${make.count})`}
                                        checked={selected.includes(makeKey)}
                                        partial={hasChild(makeKey)}
                                        toggleLabel={t.models}
                                        open={makeOpen}
                                        indent="pl-2.5"
                                        rowClass=""
                                        onSelect={() => toggleSelect(makeKey)}
                                        onToggle={() => toggleOpen(makeKey)}
                                    />
                                    {makeOpen && (
                                        <ul className="m-0 list-none p-0">
                                            {make.models.map((model) => {
                                                const modelKey = `${make.name}|${model.name}`;
                                                const modelOpen = isOpen(modelKey);
                                                return (
                                                    <li key={model.slug + model.count}>
                                                        <TreeRow
                                                            label={`${model.name} (${model.count})`}
                                                            checked={selected.includes(modelKey) || selected.includes(makeKey)}
                                                            partial={hasChild(modelKey)}
                                                            toggleLabel={t.variants}
                                                            open={modelOpen}
                                                            indent="pl-3"
                                                            rowClass="bg-[#d5d5d5]"
                                                            onSelect={() => toggleSelect(modelKey)}
                                                            onToggle={model.variants.length ? () => toggleOpen(modelKey) : undefined}
                                                        />
                                                        {modelOpen && model.variants.length > 0 && (
                                                            <ul className="m-0 list-none p-0">
                                                                {model.variants.map((variant) => {
                                                                    const variantKey = `${modelKey}|${variant}`;
                                                                    return (
                                                                        <li key={variant}>
                                                                            <TreeRow
                                                                                label={variant}
                                                                                checked={selected.includes(variantKey) || selected.includes(modelKey) || selected.includes(makeKey)}
                                                                                indent="pl-3.75"
                                                                                rowClass="bg-[#c1c1c1]"
                                                                                onSelect={() => toggleSelect(variantKey)}
                                                                            />
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
                    {filtered.length === 0 && (
                        <div className="pt-2.5 pb-3 text-center font-bold text-text-dark">No results found</div>
                    )}
                </div>
            </div>
        </>
    )
}
