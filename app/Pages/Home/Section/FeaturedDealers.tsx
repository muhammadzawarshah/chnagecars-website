"use client"

import AdBanner from "../../../components/AdBanner"
import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { dealersAd } from "../Data/ads"
import { dealers } from "../Data/dealers"
import DealerCard from "./DealerCard"

export default function FeaturedDealers() {
    return (
        <>
            <section className="m-0 -mt-px overflow-hidden bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5 pt-12.5 pb-17.5 max-[901px]:pt-6.25 max-[901px]:pb-12.5">
                <SectionTitle>Our Featured <strong>Dealers</strong></SectionTitle>
                <p className="mt-4 mb-22.5 text-center text-base leading-6.5 font-normal max-[801px]:mb-17.5 max-[768px]:text-lg">
                    Here are some of our top Dealerships! <br /> To view all of our Dealers, please click <a href="https://www.changecars.co.za/dealer-listing" className="text-gold no-underline transition duration-500 hover:underline">here</a>
                </p>
                <div className="mx-auto max-w-350">
                    <Carousel
                        items={dealers}
                        arrows={false}
                        dots
                        innerClass="h-91 max-[901px]:h-82"
                        itemClass="relative mt-5 rounded-[10px] bg-cloud"
                        renderItem={(dealer) => <DealerCard dealer={dealer} />}
                    />
                    <a href="https://www.changecars.co.za/dealer-listing" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
                </div>
                <AdBanner ad={dealersAd} className="mx-auto mt-20 mb-7.5 block w-full max-w-199 max-[901px]:mt-13.75 max-[901px]:mb-0" />
            </section>
        </>
    )
}
