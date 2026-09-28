"use client"

import SectionTitle from "../../../components/SectionTitle"
import SwipeSlider from "../../../components/SwipeSlider"
import { featuredCars } from "../Data/featuredCars"
import FeaturedCarCard from "./FeaturedCarCard"

export default function FeaturedCars() {
    return (
        <>
            <section className="m-0 -mt-px bg-[#f8fafd] px-8.75 pt-15 pb-12.5 max-[401px]:px-3.75 max-[251px]:px-2.5 max-[601px]:pt-10 max-[601px]:pb-8">
                <div className="mx-auto max-w-350">
                    <SectionTitle className="max-[601px]:mb-5">Featured <strong>Cars</strong></SectionTitle>
                    <div className="max-[601px]:-mr-3.75">
                        <SwipeSlider
                            items={featuredCars}
                            itemKey={(car) => car.title}
                            slideClass="w-1/4 max-[1241px]:w-1/3 max-[901px]:w-1/2 max-[601px]:w-[80%] max-[601px]:px-1.5"
                            renderItem={(car) => <FeaturedCarCard car={car} />}
                        />
                    </div>
                    <a href="https://www.changecars.co.za/new-or-used-cars-for-sale/" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
                </div>
            </section>
        </>
    )
}
