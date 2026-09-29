"use client"

import Link from "next/link"
import { ReactNode } from "react"
import SwipeSlider from "../../../components/SwipeSlider"
import { Car } from "@/app/lib/cars/types"
import CarCard from "../../Home/Section/CarCard"

export default function RelatedCars({ title, cars }: { title: ReactNode, cars: Car[] }) {
    return (
        <>
            <section className="border-t border-dashed border-[#cfcfcf] pt-7 pb-6 min-[981px]:pt-12 min-[981px]:pb-10">
                <h2 className="m-0 mb-4 text-center text-lg font-normal text-gold uppercase min-[981px]:mb-7 min-[981px]:text-[32px] [&_strong]:font-bold">{title}</h2>
                <div className="max-[601px]:-mr-3">
                    <SwipeSlider
                        items={cars}
                        itemKey={(car) => car.id}
                        slideClass="w-1/4 max-[1241px]:w-1/3 max-[901px]:w-1/2 max-[601px]:w-[80%] max-[601px]:px-1.5"
                        renderItem={(car) => <CarCard car={car} featured />}
                    />
                </div>
                <Link href="/cars" className="mx-auto mt-5 flex h-7 w-fit items-center rounded-[5px] bg-gold px-3.5 text-[13px] font-semibold text-white no-underline min-[981px]:mt-7.5 min-[981px]:h-10 min-[981px]:px-6 min-[981px]:text-base">View All</Link>
            </section>
        </>
    )
}
