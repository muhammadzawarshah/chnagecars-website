"use client"

import { ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import AdBanner from "../../../../components/AdBanner"
import { heroAd } from "../../Data/ads"

type FiltersPageProps = {
    onBack: () => void
    onApply: () => void
    onReset: () => void
    children: ReactNode
}

export default function FiltersPage({ onBack, onApply, onReset, children }: FiltersPageProps) {

    const { t } = useLanguage();

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    return createPortal(
        <>
            <div className="fixed inset-0 z-850 flex flex-col bg-white">
                <div className="relative shrink-0 pt-[67px]">
                    <button onClick={onBack} aria-label="Back" className="absolute top-[18px] left-[18px] flex size-5.5 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                        <svg width="17.5" height="15" viewBox="0 0 18 15" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 7.5H1.5M7.5 1.2L1.2 7.5l6.3 6.3" />
                        </svg>
                    </button>
                    <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="mx-auto block h-auto w-[158.6px]" />
                    <p className="mt-[13px] mb-0 text-center text-[13.5px] leading-[1.2] text-black capitalize">
                        {t.taglineStart.toLowerCase()} <span className="text-[#957e4e]">{t.taglineHighlight.toLowerCase()}</span>
                    </p>
                    <AdBanner ad={heroAd} className="mx-auto mt-[13px] block w-[76%]" />
                    <h3 className="mt-3.5 mb-0 text-center text-[17.4px] leading-[1.2] font-normal text-black">Filters</h3>
                </div>
                <div className="flex-1 overflow-y-auto pt-5 pr-6 pb-5 pl-5 [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-r-4 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#957e4e] [&::-webkit-scrollbar-thumb]:bg-clip-padding">
                    <div className="grid grid-cols-2 gap-x-[9px] gap-y-[19.5px]">
                        {children}
                    </div>
                </div>
                <div className="flex h-[45.5px] shrink-0 border-t border-[#eeeeee]">
                    <button onClick={onApply} className="w-1/2 cursor-pointer border-0 bg-[#957e4e] text-[15px] text-white">Apply</button>
                    <button onClick={onReset} className="w-1/2 cursor-pointer border-0 bg-white text-[15.2px] text-black">Reset</button>
                </div>
            </div>
        </>,
        document.body
    )
}
