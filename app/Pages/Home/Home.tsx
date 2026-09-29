import Hero from "./Section/Hero"
import AppExtras from "./Section/AppExtras"
import Testimonials from "./Section/Testimonials"
import CarSection from "./Section/CarSection"
import { getFeaturedCars, getRecentCars } from "@/app/lib/cars/api"
import QuickSearch from "./Section/QuickSearch"
import LatestArticles from "./Section/LatestArticles"
import CarTypes from "./Section/CarTypes"
import Specials from "./Section/Specials"
import FeaturedDealers from "./Section/FeaturedDealers"
import CallToActions from "./Section/CallToActions"
import PopularBrands from "./Section/PopularBrands"
import BottomAd from "./Section/BottomAd"

export default async function Home() {

    const [featuredCars, recentCars] = await Promise.all([getFeaturedCars(), getRecentCars()]);

    return (
        <>
            <div className="pointer-events-none fixed top-0 left-0 z-2 h-full w-[32%] bg-black/60 min-[1653px]:w-[40%] max-[1250px]:w-[34%] max-[1168px]:w-[36%] max-[1106px]:w-[38%] max-[1043px]:w-[39%] max-[1001px]:w-[41%] max-[981px]:w-full"></div>
            <main className="relative z-3 min-[1500px]:overflow-auto">
                <Hero />
                <AppExtras />
                <Testimonials />
                <CarSection title={<>Featured <strong>Cars</strong></>} cars={featuredCars} />
                <CarSection title={<>Recently Added <strong>Cars</strong></>} cars={recentCars} />
                <QuickSearch />
                <LatestArticles />
                <CarTypes />
                <Specials />
                <FeaturedDealers />
                <CallToActions />
                <PopularBrands />
                <BottomAd />
                <div className="relative top-px -mt-px h-px"></div>
            </main>
        </>
    )
}
