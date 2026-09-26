"use client"

import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { dealers } from "../Data/dealers"
import DealerCard from "./DealerCard"

export default function FeaturedDealers() {
    return (
        <>
            <section className="m-0 -mt-px overflow-hidden bg-white px-8.75 pb-22.5 max-[901px]:pb-13.75">
                <SectionTitle>Our Featured <strong>Dealers</strong></SectionTitle>
                <p className="mt-4 mb-22.5 text-center text-base leading-6.5 font-normal max-[801px]:mb-17.5 max-[768px]:text-lg">
                    Here are some of our top Dealerships! <br /> To view all of our Dealers, please click <a href="https://www.changecars.co.za/dealer-listing" className="text-[#0000ee] underline">here</a>
                </p>
                <div className="mx-auto max-w-350">
                    <Carousel
                        items={dealers}
                        innerClass="h-91 max-[901px]:h-82"
                        itemClass="relative mt-5 rounded-[10px] bg-cloud"
                        renderItem={(dealer) => <DealerCard dealer={dealer} />}
                    />
                </div>
            </section>
        </>
    )
}
