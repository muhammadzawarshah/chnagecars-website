import AdBanner from "../../../components/AdBanner"
import { heroAd } from "../Data/ads"
import Intro from "./Intro"
import SideSearch from "./SideSearch/SideSearch"

export default function Hero() {
    return (
        <>
            <div className="relative mx-auto flow-root w-full max-w-350 px-5 pt-5 pb-15 min-[1000px]:pt-0 min-[1000px]:pb-25 max-[601px]:pb-0">
                <Intro />
                <SideSearch />
                <AdBanner ad={heroAd} className="relative left-1/2 mt-7.5 hidden w-full max-w-172.5 -translate-x-1/2 max-[981px]:inline-block max-[601px]:hidden" />
            </div>
        </>
    )
}
