"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronIcon, ClearIcon } from "./Icons"
import { editorBorder, InvalidBadge, InvalidMessage, Placeholder, ValidBadge } from "./DxParts"

type DxSelectProps = {
    placeholder: string
    options: string[]
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    searchable?: boolean
    invalid?: boolean
    message?: string
    validStyle?: boolean
    autoFocus?: boolean
}

// DevExtreme dxSelectBox look-alike, as rendered by the WeeLee form.
export default function DxSelect({ placeholder, options, value, onChange, disabled = false, searchable = false, invalid = false, message, validStyle = false, autoFocus = false }: DxSelectProps) {

    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [search, setSearch] = useState<string | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    useEffect(() => {
        if (!open) return;
        function outside(event: MouseEvent) {
            if (!boxRef.current?.contains(event.target as Node)) close();
        }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, [open]);

    function close() {
        setOpen(false);
        setSearch(null);
    }

    function pick(option: string) {
        onChange(option);
        close();
    }

    const text = search ?? value;
    const shown = search ? options.filter((option) => option.toLowerCase().includes(search.toLowerCase())) : options;
    const valid = validStyle && !!value;

    return (
        <>
            <div ref={boxRef} className={`relative h-[55px] w-full rounded-[4px] bg-white font-dx text-sm leading-[1.35715] text-[#333] ${editorBorder(valid, invalid, focused)} ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
                <div className="flex h-full">
                    <div className="relative flex h-full min-w-0 flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            readOnly={!searchable}
                            disabled={disabled}
                            autoComplete="off"
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            onClick={() => (open ? close() : setOpen(true))}
                            onChange={(event) => { setSearch(event.target.value); setOpen(true); }}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") close();
                                if (event.key === "Enter" && open && shown[0]) { event.preventDefault(); pick(shown[0]); }
                            }}
                            className={`h-full w-full min-w-0 cursor-pointer rounded-[4px] bg-transparent py-[7px] pl-[9px] font-poppins text-lg text-[#333] outline-none ${invalid ? "pr-[34px]" : "pr-0"}`}
                        />
                        {!text && <Placeholder text={placeholder} />}
                        {invalid && <InvalidBadge />}
                    </div>
                    {value && !disabled && (
                        <span onMouseDown={(event) => { event.preventDefault(); onChange(""); close(); }} className="flex h-full w-[34px] min-w-[34px] cursor-pointer items-center justify-center">
                            <ClearIcon />
                        </span>
                    )}
                    <span onMouseDown={(event) => { event.preventDefault(); inputRef.current?.focus(); if (open) close(); else setOpen(true); }} className="flex h-full w-[34px] shrink-0 items-center justify-center p-px">
                        <ChevronIcon />
                    </span>
                </div>
                {valid && <ValidBadge right="right-2" />}
                {invalid && focused && !open && message && <InvalidMessage text={message} />}
                {open && (
                    <div className="absolute top-[calc(100%+1px)] right-[-1px] left-[-1px] z-20 max-h-[387px] overflow-y-auto rounded-[6px] border border-t-0 border-[#ddd] bg-white p-px shadow-[0_6px_12px_rgba(0,0,0,0.176)] [scrollbar-width:none]">
                        {shown.length ? shown.map((option) => (
                            <div
                                key={option}
                                onMouseDown={(event) => { event.preventDefault(); pick(option); }}
                                className={`cursor-pointer truncate px-[9px] py-[7px] text-left font-dx text-lg leading-[1.35715] text-[#333] ${option === value ? "bg-black/10 hover:bg-black/7" : "hover:bg-black/4"}`}
                            >
                                {option}
                            </div>
                        )) : (
                            <div className="min-h-[3em] p-2.5 text-left font-dx text-sm text-[#333]">No data to display</div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
