"use client"

import { ReactNode } from "react"
import { createPortal } from "react-dom"

type DealerPopupProps = {
    onClose: () => void
    className: string
    children: ReactNode
}

// White dealer card over a dimmed page, used by the star rating and opening hours.
export default function DealerPopup({ onClose, className, children }: DealerPopupProps) {
    return createPortal(
        <>
            <div onClick={onClose} className="fixed inset-0 z-5001 bg-black/50"></div>
            <div className={`fixed top-1/2 left-1/2 z-6000 w-88.75 max-w-[calc(100%-40px)] -translate-x-1/2 -translate-y-1/2 rounded-[10px] bg-white font-sans ${className}`}>
                <button type="button" onClick={onClose} aria-label="Close" className="absolute top-2.5 right-2.5 z-10 size-5.5 cursor-pointer border-0 bg-[url(/img/car-detail/orig/dealer-popup-close.svg)] bg-contain bg-no-repeat p-0"></button>
                {children}
            </div>
        </>,
        document.body
    )
}
