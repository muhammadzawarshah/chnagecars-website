"use client"

import { ReactNode } from "react"
import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { Brand } from "../Data/brands"
import BrandCard from "./BrandCard"

export default function BrandCarousel({ title, brands }: { title: ReactNode, brands: Brand[] }) {
    return (
        <>
            <div className="mb-12.5">
                <SectionTitle className="max-[951px]:mb-13.75">{title}</SectionTitle>
                <Carousel
                    items={brands}
                    breakpoints={[{ max: 1200, perView: 2, gap: 19 }, { max: 746, perView: 1, gap: 10 }]}
                    gap={17.5}
                    prevClass="-top-9 right-15"
                    nextClass="-top-9 right-2.5"
                    innerClass="pl-2.5 max-[1201px]:pr-2.5"
                    listClass="min-h-75 pt-2.5 pb-5 max-[681px]:pt-3.75"
                    renderItem={(brand, _index, visible) => (
                        <div className={`mb-3.75 rounded-[10px] px-6.25 pt-12.5 pb-7 text-center max-[301px]:px-3.75 ${visible ? "shadow-[5px_5px_15px_0px_rgba(0,0,0,0.149)]" : ""}`}>
                            <BrandCard brand={brand} />
                        </div>
                    )}
                />
            </div>
        </>
    )
}
