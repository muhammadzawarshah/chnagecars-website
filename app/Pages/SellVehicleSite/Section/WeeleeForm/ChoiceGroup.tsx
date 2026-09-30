"use client"

import { useState } from "react"
import ConditionTip from "./ConditionTip"

type Option = {
    label: string
    disabled?: boolean
    notes?: string[][]
}

type ChoiceGroupProps = {
    options: Option[]
    value: string
    onChange: (value: string) => void
    invalid?: boolean
    // fuel / condition: phone gap under each button; sell: wider gap between the two rows; service: stacked list.
    layout?: "plain" | "fuel" | "condition" | "sell" | "service"
}

const button = "relative w-full min-h-[55px] cursor-pointer rounded-lg px-3 py-1.5 text-center align-middle font-poppins text-lg leading-[2.4] font-normal select-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-in-out";
const idle = "border border-[#616161] bg-white text-[#616161] hover:bg-gold hover:text-white";
const disabledButton = "pointer-events-none border border-[#616161] bg-[#656d70] text-white opacity-25";
const badge = "after:pointer-events-none after:absolute after:-mt-[9px] after:size-[18px] after:rounded-full after:bg-gold after:text-center after:font-poppins after:text-[13px] after:leading-[18px] after:font-semibold after:text-white after:content-['✔']";

// Bootstrap toggle buttons of the WeeLee form (btn-group of label.btn).
export default function ChoiceGroup({ options, value, onChange, invalid = false, layout = "plain" }: ChoiceGroupProps) {

    const [tip, setTip] = useState<{ anchor: HTMLElement, notes: string[][] } | null>(null);
    const frame = invalid ? "border-2 border-[#f00] p-2.5" : "";

    function state(option: Option) {
        if (option.disabled) return disabledButton;
        return option.label === value ? `border-0 bg-gold text-white ${badge}` : idle;
    }

    if (layout === "service") {
        return (
            <>
                <div className={`relative ${frame}`}>
                    {options.map((option, index) => (
                        <label key={option.label} onClick={() => onChange(option.label)} className={`${button} mb-2 inline-block ${index > 0 ? "-ml-px" : ""} ${state(option)} after:top-[0.5cqh] after:right-[-0.5cqw]`}>
                            {option.label}
                        </label>
                    ))}
                </div>
            </>
        )
    }

    const tipped = layout === "fuel" || layout === "condition";

    return (
        <>
            <div className={`relative flex ${frame}`}>
                <div className="w-full">
                    <div className={`-mx-3 flex flex-wrap ${layout === "condition" ? "pb-4" : "pb-2"}`}>
                        {options.map((option, index) => (
                            <div key={option.label} className={`w-1/2 shrink-0 px-3 ${tipped ? "pb-1 @min-[768px]:pb-0" : ""} ${index > 1 ? (layout === "sell" ? "mt-2" : tipped ? "mt-1" : "") : ""}`}>
                                <label
                                    onClick={() => !option.disabled && onChange(option.label)}
                                    onMouseEnter={(event) => option.notes && setTip({ anchor: event.currentTarget, notes: option.notes })}
                                    onMouseLeave={() => setTip(null)}
                                    className={`${button} inline-block ${state(option)} after:top-[8%] after:right-[-3%]`}
                                >
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                {tip && <ConditionTip anchor={tip.anchor} notes={tip.notes} onClose={() => setTip(null)} />}
            </div>
        </>
    )
}
