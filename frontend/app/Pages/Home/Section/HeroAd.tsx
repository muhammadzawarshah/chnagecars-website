"use client"

import AdBanner from "../../../components/AdBanner"
import { useAd } from "../../../components/AdsContext"

export default function HeroAd({ className }: { className: string }) {
    if (!useAd("hero")) return null
    return (
        <>
            <div className={`hidden bg-[#f8fafd] px-2.5 pt-[20.67px] pb-5 ${className}`}>
                <AdBanner placement="hero" className="block w-full" />
            </div>
        </>
    )
}
