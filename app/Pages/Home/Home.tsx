import Hero from "./Section/Hero"
import Testimonials from "./Section/Testimonials"
import QuickSearch from "./Section/QuickSearch"
import LatestArticles from "./Section/LatestArticles"
import CarTypes from "./Section/CarTypes"
import Specials from "./Section/Specials"
import FeaturedDealers from "./Section/FeaturedDealers"
import CallToActions from "./Section/CallToActions"
import PopularBrands from "./Section/PopularBrands"

export default function Home() {
    return (
        <>
            <div className="pointer-events-none fixed top-0 left-0 z-2 h-full w-[32%] bg-black/60 min-[1653px]:w-[40%] max-[1250px]:w-[34%] max-[1168px]:w-[36%] max-[1106px]:w-[38%] max-[1043px]:w-[39%] max-[1001px]:w-[41%] max-[981px]:w-full"></div>
            <main className="relative z-3 min-[1500px]:overflow-auto">
                <Hero />
                <Testimonials />
                <QuickSearch />
                <LatestArticles />
                <CarTypes />
                <Specials />
                <FeaturedDealers />
                <CallToActions />
                <PopularBrands />
                <div className="relative top-px -mt-0.5 h-px"></div>
            </main>
        </>
    )
}
