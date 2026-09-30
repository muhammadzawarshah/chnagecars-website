"use client"

import { useState } from "react"
import { PinIcon } from "./Icons"
import { editorBorder, InvalidBadge, InvalidMessage, Placeholder, ValidBadge } from "./DxParts"

type DxTextProps = {
    placeholder: string
    value: string
    onChange: (value: string) => void
    type?: string
    inputMode?: "decimal" | "tel" | "email" | "text"
    maxLength?: number
    invalid?: boolean
    message?: string
    validStyle?: boolean
    location?: boolean
    textarea?: boolean
}

// DevExtreme dxTextBox / dxNumberBox / dxTextArea look-alike, as rendered by the WeeLee form.
export default function DxText({ placeholder, value, onChange, type = "text", inputMode, maxLength, invalid = false, message, validStyle = false, location = false, textarea = false }: DxTextProps) {

    const [focused, setFocused] = useState(false);
    const valid = validStyle && !!value && !invalid;
    const events = { onFocus: () => setFocused(true), onBlur: () => setFocused(false) };

    return (
        <>
            <div className={`relative w-full rounded-[4px] bg-white font-dx text-sm leading-[1.35715] text-[#333] ${textarea ? "h-[90px]" : "h-[55px]"} ${editorBorder(valid, invalid, focused)}`}>
                <div className="flex h-full">
                    <div className="relative flex h-full min-w-0 flex-1">
                        {textarea ? (
                            <textarea value={value} onChange={(event) => onChange(event.target.value)} {...events} className="h-full w-full resize-none rounded-[4px] bg-transparent px-[9px] pt-[7px] pb-2 font-dx text-lg leading-[1.35715] text-[#333] outline-none"></textarea>
                        ) : (
                            <input
                                type={type}
                                inputMode={inputMode}
                                maxLength={maxLength}
                                value={value}
                                autoComplete="off"
                                onChange={(event) => onChange(event.target.value)}
                                {...events}
                                className={`h-full w-full min-w-0 rounded-[4px] bg-transparent py-[7px] pl-[9px] font-poppins text-lg text-[#333] outline-none ${invalid ? "pr-[34px]" : "pr-[9px]"}`}
                            />
                        )}
                        {!value && <Placeholder text={placeholder} top={textarea} />}
                        {invalid && <InvalidBadge />}
                    </div>
                    {location && (
                        <span className="my-px mr-px flex w-9 shrink-0 cursor-pointer items-center rounded-[4px] bg-white pl-1.5 text-gold">
                            <PinIcon />
                        </span>
                    )}
                </div>
                {valid && <ValidBadge right={location ? "right-1" : "right-2"} />}
                {invalid && focused && message && <InvalidMessage text={message} />}
            </div>
        </>
    )
}
