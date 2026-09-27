"use client"

import { ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"

type BottomSheetProps = {
    title: string
    onClose: () => void
    footer?: ReactNode
    children: ReactNode
}

export default function BottomSheet({ title, onClose, footer, children }: BottomSheetProps) {

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    return createPortal(
        <>
            <div onClick={onClose} className="fixed inset-0 z-900 bg-black/54"></div>
            <div className="fixed bottom-0 left-0 z-901 flex h-[calc((100vh+24px)*0.6)] w-full flex-col overflow-hidden rounded-t-[20px] bg-white">
                <div className="relative h-14 shrink-0 border-b border-[#cac4d0]">
                    <h3 className="absolute inset-x-0 top-[17.8px] m-0 truncate pr-7.5 pl-4 text-center text-[20px] leading-[1.2] font-bold text-black">{title}</h3>
                    <button onClick={onClose} aria-label="Close" className="absolute top-[23.73px] right-[16.4px] flex size-[13.2px] cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                        <svg width="13.2" height="13.2" viewBox="0 0 14 14" fill="none" stroke="#000" strokeWidth="2">
                            <path d="M1 1l12 12M13 1L1 13" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pt-[9.5px] [&::-webkit-scrollbar]:w-[13.33px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-4 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#9d885c] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:my-3">
                    {children}
                </div>
                {footer}
            </div>
        </>,
        document.body
    )
}
