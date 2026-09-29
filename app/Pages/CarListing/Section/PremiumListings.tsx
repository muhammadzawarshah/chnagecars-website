"use client"

import Link from "next/link"
import Carousel, { blockBreakpoints } from "../../../components/Carousel"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatRand } from "@/app/lib/cars/format"

export default function PremiumListings({ cars }: { cars: Car[] }) {
    return (
        <>
            <section className="mx-auto mt-7.5 max-w-175 font-sans max-[1038px]:px-5 min-[1039px]:max-w-none">
                <h3 className="m-0 mb-4 text-[22px] leading-8 font-bold text-ink max-[600px]:text-xl">Premium Listings</h3>
                <Carousel
                    items={cars}
                    perView={4}
                    breakpoints={blockBreakpoints}
                    renderItem={(car) => (
                        <Link href={carHref(car)} className="block no-underline">
                            <h4 className="m-0 h-8.75 truncate bg-gold px-2.5 text-center leading-8.75 font-bold text-white">{car.make} {car.model}</h4>
                            <div className="h-37.5 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${car.image})` }}></div>
                            <h5 className="m-0 bg-white py-2 text-center text-base font-bold text-gold">{formatRand(car.price, " ")}</h5>
                        </Link>
                    )}
                />
            </section>
        </>
    )
}
