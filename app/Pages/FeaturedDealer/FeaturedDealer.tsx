import { Open_Sans } from "next/font/google"
import { Car } from "@/app/lib/cars/types"
import { Dealer } from "../Home/Data/dealers"
import RatingBadge from "./Section/RatingBadge"
import DealerStock from "./Section/DealerStock"

const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "700"] });

// Copies the live /featured-dealer page: dealer text and video over a photo, then the dealer's stock.
export default function FeaturedDealer({ dealer, cars }: { dealer: Dealer, cars: Car[] }) {
    return (
        <>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#1a1a1a]"></div>
            <main className="relative z-4 mt-7.5 font-sans max-[981px]:-mt-6.5">
                <DealerStock cars={cars} dealer={dealer.name} dealerFont={openSans.className} top={
                    <div key="top" className="min-h-120 max-[1231px]:min-h-100">
                        <div className="relative pt-12.5">
                            <RatingBadge name={dealer.name} href={dealer.href} />
                            <p className="m-0 mt-[21px] w-[45%] pt-2.5 pl-20.5 text-base leading-5 font-bold tracking-[0.32px] text-white max-[1231px]:w-full max-[1231px]:max-w-[733px]">
                                {dealer.about.map((line, index) => (
                                    <span key={index}>{index > 0 && <br />}{line}</span>
                                ))}
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-1/2 pt-18.75 pr-3.75 max-[1231px]:static max-[1231px]:mx-auto max-[1231px]:w-full max-[1231px]:pt-12.5 max-[1231px]:pr-0 max-[1231px]:pb-6.25 max-[801px]:pb-0">
                            <video src="/img/featured-dealer/dealer-video.mp4" autoPlay muted loop playsInline preload="none" className="inline h-100 w-full align-baseline max-[1164px]:h-75 max-[1001px]:h-100 max-[578px]:h-65"></video>
                        </div>
                    </div>
                } />
            </main>
        </>
    )
}
