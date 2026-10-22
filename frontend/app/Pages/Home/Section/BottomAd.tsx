"use client"

import AdBanner from "../../../components/AdBanner"
import { useAd } from "../../../components/AdsContext"

export default function BottomAd() {
    if (!useAd("bottom")) return null
    return (
        <>
            <section className="-mt-px bg-white px-11.25 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="pb-25 max-[901px]:pb-12.5">
                    <AdBanner placement="bottom" className="mx-auto block w-full max-w-199" />
                </div>
            </section>
        </>
    )
}
