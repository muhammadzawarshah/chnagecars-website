"use client"

import { ReactNode, useEffect, useRef, useState } from "react"

// Form pieces shared by the gold enquiry pages (Value my vehicle, Keep it, Beat my quote, New vehicle quote).

const asterisk = <span className="float-right ml-0.75 pr-0.75 text-lg leading-3.5 font-bold text-[#c00]">*</span>;
const inlineAsterisk = <span className="ml-0.75 pr-0.75 text-lg leading-3.5 font-bold text-[#c00]">*</span>;

type FloatInputProps = {
    label: string
    className: string
    // "raised" labels rest just above the line (bottom 33px); "inline" labels rest inside the field (bottom 10px).
    variant: "raised" | "inline"
    type?: string
    required?: boolean
    autoFocus?: boolean
    // Tailwind classes for the label's font at rest and when raised, per page.
    restFont?: string
    activeFont?: string
    labelClass?: string
    inputClass?: string
}

export function FloatInput({ label, className, variant, type = "text", required = true, autoFocus = false, restFont = "text-sm", activeFont = "text-xs", labelClass = "", inputClass = "" }: FloatInputProps) {

    const [focused, setFocused] = useState(autoFocus);
    const [value, setValue] = useState("");
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) input.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    const active = focused || value !== "";

    return (
        <>
            <li className={`relative ${className}`}>
                <label className={`pointer-events-none absolute left-0 leading-3.5 font-light text-white transition-all duration-300 ${active ? `bottom-[80%] ${activeFont}` : `${variant === "raised" ? "bottom-8.25" : "bottom-2.5"} ${restFont}`} ${labelClass}`}>
                    {label}{required && asterisk}
                </label>
                <input
                    ref={input}
                    type={type}
                    aria-label={label}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`block h-11.25 w-full cursor-text border-0 border-b border-white/60 bg-transparent pr-12.5 pl-3.75 font-sans text-sm text-white outline-none ${inputClass}`}
                />
            </li>
        </>
    )
}

type DropSelectProps = {
    label: string
    className: string
    placeholder: string
    options: string[]
    required?: boolean
    disabled?: boolean
    value?: string
    onChange?: (value: string) => void
    labelClass?: string
    selectClass?: string
}

export function DropSelect({ label, className, placeholder, options, required = true, disabled = false, value, onChange, labelClass = "text-sm", selectClass = "" }: DropSelectProps) {
    return (
        <>
            <li className={`relative ${className}`}>
                <label className={`relative top-1.25 block w-fit leading-4.5 font-light text-white ${labelClass}`}>
                    {label}{required && inlineAsterisk}
                </label>
                <div className="relative mt-2.5 after:pointer-events-none after:absolute after:top-1/2 after:right-2.5 after:size-3 after:-translate-y-1/2 after:bg-[url(/img/quote-forms/dd-gold.svg)] after:bg-contain after:bg-center after:bg-no-repeat after:content-['']">
                    <select
                        aria-label={label}
                        disabled={disabled}
                        value={value}
                        defaultValue={value === undefined ? "" : undefined}
                        onChange={(event) => onChange?.(event.target.value)}
                        className={`block h-8.25 w-full min-w-full cursor-pointer max-[842px]:w-[140px] appearance-none truncate rounded-[5px] border border-transparent bg-white p-1.75 font-sans text-[14.4px] leading-[16.56px] text-gold outline-none disabled:cursor-default disabled:opacity-50 ${selectClass}`}
                    >
                        <option value="">{placeholder}</option>
                        {options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>
            </li>
        </>
    )
}

type MessageBoxProps = {
    label: string
    className: string
    labelClass?: string
    textareaClass?: string
    required?: boolean
}

export function MessageBox({ label, className, labelClass = "", textareaClass = "", required = true }: MessageBoxProps) {
    return (
        <>
            <li className={`relative ${className}`}>
                <label className={`relative block w-fit text-sm leading-4.5 font-light text-white ${labelClass}`}>
                    {label}{required && inlineAsterisk}
                </label>
                <textarea aria-label={label} className={`block w-full max-w-full resize-none overflow-hidden rounded-[5px] border border-transparent bg-white p-2.5 font-sans text-base leading-4 text-ink outline-none ${textareaClass}`}></textarea>
            </li>
        </>
    )
}

export function RobotCheck({ className, spanClass = "text-xs" }: { className: string, spanClass?: string }) {
    return (
        <>
            <li className={`z-5 ${className}`}>
                <label className="relative -top-2.5 float-left my-2.5 mr-2.5 block size-5.5 cursor-pointer rounded-[5px] bg-white bg-center bg-no-repeat has-checked:bg-[url(/img/specials/close-gold-hover.svg)] has-checked:bg-size-[14px_14px]">
                    <input type="checkbox" required aria-label="I'm not a robot" className="absolute inset-0 m-0 size-full cursor-pointer appearance-none opacity-0" />
                </label>
                <span className={`flex h-5.5 gap-0.75 leading-5.5 font-medium text-[#f5f5f5] ${spanClass}`}>
                    I`m not a robot<span className="pr-0.75 text-lg leading-5.5 font-bold text-[#c00]">*</span>
                </span>
            </li>
        </>
    )
}

export function SubmitButton({ className = "", children = "Submit form" }: { className?: string, children?: ReactNode }) {
    return (
        <>
            <button type="submit" className={`block h-10 w-38 cursor-pointer rounded-[5px] border-0 font-sans text-sm leading-10 text-white shadow-[0_3px_6px_rgba(0,0,0,0.07)] transition duration-300 hover:opacity-80 active:opacity-80 ${className}`}>{children}</button>
        </>
    )
}
