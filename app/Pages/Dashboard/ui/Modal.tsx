"use client"

import { ReactNode, useEffect, useRef } from "react"
import Icon from "./Icon"

// A native <dialog>: focus is trapped, Esc and a click on the backdrop close it.
export default function Modal({ open, onClose, title, subtitle, children, width = 560 }: { open: boolean, onClose: () => void, title: ReactNode, subtitle?: ReactNode, children: ReactNode, width?: number }) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return
        if (open && !element.open) element.showModal()
        if (!open && element.open) element.close()
    }, [open])

    return (
        <dialog ref={ref} onClose={onClose} onClick={(event) => { if (event.target === ref.current) onClose() }}
            style={{ width: `min(${width}px, calc(100vw - 32px))` }}
            className="m-auto rounded-2xl border-0 bg-white p-0 text-ink shadow-[0_24px_64px_rgba(26,26,26,0.25)] backdrop:bg-[rgba(26,26,26,0.55)]">
            {open && (
                <div className="p-6 max-[480px]:p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="m-0 text-xl font-bold">{title}</h2>
                            {subtitle && <p className="mt-1 mb-0 text-sm text-[#6b6862]">{subtitle}</p>}
                        </div>
                        <button type="button" aria-label="Close" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#f4f2ee] text-ink hover:bg-[#ebe8e1]" onClick={onClose}><Icon name="close" size={16} /></button>
                    </div>
                    {children}
                </div>
            )}
        </dialog>
    )
}
