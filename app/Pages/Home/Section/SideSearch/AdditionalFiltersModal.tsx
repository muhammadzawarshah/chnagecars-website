"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { additionalFilters } from "../../Data/additionalFilters"
import AdditionalFilterField from "./AdditionalFilterField"
import DealershipField from "./DealershipField"

type AdditionalFiltersModalProps = {
    values: Record<string, string[]>
    onChange: (values: Record<string, string[]>) => void
    onClose: () => void
    onSearch: () => void
}

export default function AdditionalFiltersModal({ values, onChange, onClose, onSearch }: AdditionalFiltersModalProps) {

    const [openField, setOpenField] = useState<string | null>(null);

    function toggle(key: string) {
        setOpenField(openField === key ? null : key);
    }

    const button = "inline-flex h-13.75 cursor-pointer items-center gap-4 rounded-md bg-ink px-10.5 text-sm text-white no-underline transition duration-300 max-[621px]:h-10 max-[621px]:gap-2.5 max-[621px]:px-2.5 min-[1024px]:hover:opacity-80";

    return createPortal(
        <div className="fixed inset-0 z-400011">
            <div onClick={onClose} className="flex h-full w-full items-center justify-center overflow-y-auto bg-black/50 p-5">
                <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-170.5 rounded-2xl bg-gold px-7.5 py-16.25 max-[1201px]:px-5 max-[1201px]:py-12.5">
                    <a onClick={onClose} className="absolute top-5.25 right-18.75 flex size-7.5 cursor-pointer items-center justify-center max-[621px]:right-5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                    </a>
                    <h2 className="mx-0 mt-0 mb-13.75 text-center text-[32px] font-bold text-white max-[1201px]:mb-7.5 max-[621px]:text-[28px]">Set Additional Filters</h2>
                    <div className="mx-auto w-full max-w-121.5">
                        <div className="mb-7 flex flex-wrap gap-x-5 gap-y-8">
                            {additionalFilters.map((filter) => (
                                <AdditionalFilterField
                                    key={filter.key}
                                    filter={filter}
                                    selected={values[filter.key] ?? []}
                                    open={openField === filter.key}
                                    multiple={filter.key === "vehicleGroup"}
                                    onToggle={() => toggle(filter.key)}
                                    onChange={(selected) => onChange({ ...values, [filter.key]: selected })}
                                />
                            ))}
                            <DealershipField
                                selected={values.dealership ?? []}
                                open={openField === "dealership"}
                                onToggle={() => toggle("dealership")}
                                onChange={(selected) => onChange({ ...values, dealership: selected })}
                            />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-5">
                            <a onClick={onClose} className={button}>Save & Close</a>
                            <a onClick={onSearch} className={button}>
                                <img src="/img/magnifying-glass-white.svg" alt="" className="w-5 max-[621px]:w-3.75" />
                                Save & Search
                            </a>
                            <a onClick={() => onChange({})} className="cursor-pointer text-xs font-normal text-white max-[676px]:text-sm min-[1024px]:hover:underline">Clear Search</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
