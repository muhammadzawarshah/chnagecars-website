"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { MissingGlyph } from "./Icons"

type ConditionTipProps = {
    anchor: HTMLElement
    notes: string[][]
    onClose: () => void
}

// dxTooltip shown above a condition button; the form frame is its viewport, like the live iframe.
export default function ConditionTip({ anchor, notes, onClose }: ConditionTipProps) {

    const ref = useRef<HTMLDivElement>(null);
    const [place, setPlace] = useState<{ left: number, top: number, arrow: number } | null>(null);

    useLayoutEffect(() => {
        const tip = ref.current;
        const scroller = anchor.closest<HTMLElement>("[data-weelee-scroll]");
        const frame = scroller?.parentElement;
        if (!tip || !scroller || !frame) return;
        tip.style.maxWidth = `${scroller.clientWidth * 0.95}px`;
        const box = frame.getBoundingClientRect();
        const target = anchor.getBoundingClientRect();
        const size = tip.getBoundingClientRect();
        const center = target.left - box.left + target.width / 2;
        const left = Math.min(Math.max(center - size.width / 2, 10), scroller.clientWidth - 10 - size.width);
        setPlace({ left, top: target.top - box.top - 8 - size.height, arrow: center - left - 10 });
    }, [anchor]);

    return (
        <>
            <div ref={ref} role="tooltip" style={{ left: place?.left ?? 0, top: place?.top ?? 0, visibility: place ? "visible" : "hidden" }} className="fixed z-50 w-max rounded-[4px] border border-[#ddd] bg-white text-center font-dx shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]">
                <div style={{ left: place?.arrow ?? 0 }} className="absolute -bottom-2.5 h-2.5 w-5 overflow-hidden">
                    <span className="absolute top-[-7.07px] left-[2.93px] size-[14.14px] rotate-45 border border-[#ddd] bg-white"></span>
                </div>
                <div className="inline-block px-[17px] py-3 text-[11.9px] leading-[normal] text-[#333]">
                    <ul className="my-1 mr-6 ml-1 list-disc pl-8 text-left">
                        {notes.map((lines) => (
                            <li key={lines[0]}>
                                {lines.map((line, index) => (
                                    <span key={index}>{index > 0 && <br />}{line}</span>
                                ))}
                            </li>
                        ))}
                    </ul>
                    <button type="button" onClick={onClose} aria-label="Close" className="absolute top-2.5 right-2.5 block cursor-pointer px-1.5 py-px text-[#6eb200] @min-[768px]:hidden">
                        <MissingGlyph className="h-6 w-4.5" />
                    </button>
                </div>
            </div>
        </>
    )
}
