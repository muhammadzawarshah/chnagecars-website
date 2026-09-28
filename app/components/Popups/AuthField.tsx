"use client"

import { useState } from "react"

type AuthFieldProps = {
    label: string
    type?: string
    value: string
    error?: string
    className?: string
    light?: boolean
    onChange: (value: string) => void
}

export default function AuthField({ label, type = "text", value, error, className = "", light = false, onChange }: AuthFieldProps) {

    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);

    const isPassword = type === "password";
    const raised = focused || value.length > 0;

    return (
        <li className={`relative float-left mx-0 mt-0 mb-6.25 block h-11.25 w-full p-0 ${className}`}>
            <label className={`pointer-events-none absolute transition-all ${light ? "text-[#8c8c8c]" : "text-white"} duration-300 ${raised ? "bottom-[80%] text-xs font-extralight" : "bottom-2.5 text-sm font-extralight"}`}>
                {label}
            </label>
            {isPassword && (
                <span onClick={() => setVisible(!visible)} className={`absolute top-0 right-0 z-5 block h-full w-12.5 cursor-pointer bg-[url(/img/icon-eye.svg)] bg-size-[15px] bg-center bg-no-repeat hover:bg-size-[16px] ${light ? "invert" : ""}`}></span>
            )}
            <input
                type={isPassword && visible ? "text" : type}
                value={value}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
                className={`mb-3.25 block h-11.25 w-full cursor-pointer rounded-none border-0 border-b bg-transparent px-3.75 pr-12.5 text-sm outline-none ${light ? "border-[#d9d9d9] text-black focus:border-[#957e4e]" : "border-white/60 text-white"}`}
            />
            {error && <span className="absolute top-12.25 block w-full text-xs font-extralight text-[#c00]">{error}</span>}
        </li>
    )
}
