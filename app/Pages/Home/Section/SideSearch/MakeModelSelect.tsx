"use client"

import { useState } from "react"
import { makes } from "../../Data/makes"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import MakeRow from "./MakeRow"

type MakeModelSelectProps = {
    selected: string[]
    onChange: (selected: string[]) => void
}

export default function MakeModelSelect({ selected, onChange }: MakeModelSelectProps) {

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
            <div className="max-h-62.5 overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-track]:bg-[#f4f4f4]">
                <ul className="m-0 list-none p-1.5">
                    {makes.map((make) => {
                        const makeKey = make.name;
                        const makeOpen = openKeys.includes(makeKey);
                        return (
                            <li key={make.slug + make.count}>
                                <MakeRow label={make.name} count={make.count} selected={selected.includes(makeKey)} indent="pl-2.5" toggleLabel={t.models} open={makeOpen} onSelect={() => toggleSelect(makeKey)} onToggle={() => toggleOpen(makeKey)} />
                                {makeOpen && (
                                    <ul className="m-0 list-none p-0">
                                        <li>
                                            <MakeRow label={t.all} selected={selected.includes(makeKey)} indent="pl-6" onSelect={() => toggleSelect(makeKey)} />
                                        </li>
                                        {make.models.map((model) => {
                                            const modelKey = `${makeKey}|${model.name}`;
                                            const modelOpen = openKeys.includes(modelKey);
                                            return (
                                                <li key={model.slug + model.count}>
                                                    <MakeRow
                                                        label={model.name}
                                                        count={model.count}
                                                        selected={selected.includes(modelKey) || selected.includes(makeKey)}
                                                        indent="pl-6"
                                                        toggleLabel={t.variants}
                                                        open={modelOpen}
                                                        onSelect={() => toggleSelect(modelKey)}
                                                        onToggle={model.variants.length > 0 ? () => toggleOpen(modelKey) : undefined}
                                                    />
                                                    {modelOpen && (
                                                        <ul className="m-0 list-none p-0">
                                                            {model.variants.map((variant) => {
                                                                const variantKey = `${modelKey}|${variant}`;
                                                                return (
                                                                    <li key={variant}>
                                                                        <MakeRow label={variant} selected={selected.includes(variantKey) || selected.includes(modelKey) || selected.includes(makeKey)} indent="pl-9.5" onSelect={() => toggleSelect(variantKey)} />
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
