"use client"

import Link from "next/link"
import Carousel from "../../../components/Carousel"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatRand } from "@/app/lib/cars/format"

const premiumBreakpoints = [
    { max: 1220, perView: 3 },
    { max: 1038, perView: 2 },
];

export default function PremiumListings({ cars }: { cars: Car[] }) {
    return (
        <>
            <section className="mx-auto mt-10 max-w-175 px-5 font-sans min-[1039px]:mt-2.75 min-[1039px]:max-w-none min-[1039px]:px-0">
                <h3 className="m-0 mb-3.75 text-lg leading-8 font-semibold text-black">Premium Listings</h3>
                <Carousel
                    items={cars}
                    perView={4}
                    breakpoints={premiumBreakpoints}
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
