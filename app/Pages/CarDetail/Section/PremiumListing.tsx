"use client"

import Link from "next/link"
import Carousel from "../../../components/Carousel"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatRand } from "@/app/lib/cars/format"

const breakpoints = [
    { max: 1220, perView: 3 },
    { max: 600, perView: 2 },
];

export default function PremiumListing({ cars }: { cars: Car[] }) {
    return (
        <>
            <section className="mt-7.5 mb-12.5">
                <h3 className="m-0 mb-3.75 text-lg leading-6 font-semibold text-black">Premium Listing</h3>
                <p className="my-4 pr-27.5 text-base leading-[18.4px] text-black max-[600px]:pr-0">Did you know that these great vehicles are also in your budget!</p>
                <Carousel
                    items={cars}
                    perView={4}
                    breakpoints={breakpoints}
                    arrows={false}
                    itemClass="min-w-0"
                    renderItem={(car) => (
                        <Link href={carHref(car)} className="block no-underline">
                            <h4 className="m-0 h-8.75 truncate bg-gold px-2.5 text-center text-base leading-8.75 font-bold text-white">{car.make} {car.model}</h4>
                            <div className="h-37.5 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${car.image})` }}></div>
                            <h5 className="m-0 h-7.5 bg-[#fefefe] px-2.5 text-center text-[13.28px] leading-7.5 font-bold text-gold">{formatRand(car.price, " ")}</h5>
                        </Link>
                    )}
                />
            </section>
        </>
    )
}
