import AdBanner from "../../../components/AdBanner"
import { heroAd } from "../Data/ads"

export default function HeroAd({ className }: { className: string }) {
    return (
        <>
            <div className={`hidden bg-[#f8fafd] px-2.5 pt-[20.67px] pb-5 ${className}`}>
                <AdBanner ad={heroAd} className="block w-full" />
            </div>
        </>
    )
}
