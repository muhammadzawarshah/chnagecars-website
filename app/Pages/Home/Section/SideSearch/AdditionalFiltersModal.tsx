"use client"

import { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import AdBanner from "../../../../components/AdBanner"
import { heroAd } from "../../Data/ads"

type AdditionalFiltersModalProps = {
    onClose: () => void
    onApply: () => void
    onReset: () => void
    children: ReactNode
}

export default function AdditionalFiltersModal({ onClose, onApply, onReset, children }: AdditionalFiltersModalProps) {

    const { t } = useLanguage();

    return createPortal(
        <div data-filters-modal className="fixed inset-0 z-400011">
            <div onClick={onClose} className="flex h-full w-full items-center justify-center overflow-y-auto bg-black/50 p-5">
                <div onClick={(e) => e.stopPropagation()} className="relative my-auto w-full max-w-170.5 rounded-2xl bg-white px-7.5 pt-12.5 pb-10 max-[621px]:px-5">
                    <button onClick={onClose} aria-label="Close" className="absolute top-5.25 right-6 flex size-7.5 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1L13 13M13 1L1 13" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <div className="mx-auto w-full max-w-121.5">
                        <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="mx-auto block h-auto w-[158.6px]" />
                        <p className="mt-3.25 mb-0 text-center text-[13.5px] leading-[1.2] text-black capitalize">
                            {t.taglineStart.toLowerCase()} <span className="text-[#957e4e]">{t.taglineHighlight.toLowerCase()}</span>
                        </p>
                        <AdBanner ad={heroAd} className="mt-3.25 block w-full" />
                        <h2 className="mx-0 mt-3.5 mb-7.5 text-center text-[26px] leading-[1.2] font-normal text-black">Filters</h2>
                        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5">
                            {children}
                        </div>
                        <div className="mt-8.75 flex h-[45.5px] overflow-hidden rounded-[5px] border border-[#e8e8e8]">
                            <button onClick={onApply} className="w-1/2 cursor-pointer border-0 bg-[#957e4e] text-[15px] text-white transition duration-200 hover:opacity-85">Apply</button>
                            <button onClick={onReset} className="w-1/2 cursor-pointer border-0 bg-white text-[15.2px] text-black transition duration-200 hover:bg-[#f5f5f5]">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
