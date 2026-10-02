"use client"

import { ReactNode } from "react"
import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { Brand } from "../Data/brands"
import BrandCard from "./BrandCard"
import BrandMiniCard from "./BrandMiniCard"
import SwipeSlider from "../../../components/SwipeSlider"

type BrandCarouselProps = {
    title: ReactNode
    brands: Brand[]
    banner?: string
    dots?: boolean
    viewAll?: string
}

export default function BrandCarousel({ title, brands, banner, dots = false, viewAll }: BrandCarouselProps) {
    return (
        <>
            <div data-brand-block className="pb-25 max-[901px]:pb-12.5">
                <SectionTitle className={banner ? "max-[951px]:mb-3" : "max-[951px]:mb-13.75"}>{title}</SectionTitle>
                {banner && (
                    <div className="mb-5 max-[981px]:-mx-8.75 max-[401px]:-mx-3.75 max-[251px]:-mx-2.5">
                        <img src={banner} alt="" className="block aspect-12/5 w-full object-cover object-[50%_60%] max-[601px]:aspect-auto" />
                    </div>
                )}
                <div className="max-[601px]:hidden">
                    <Carousel
                        items={brands}
                        dots={dots}
                        arrows={false}
                        breakpoints={[{ max: 1200, perView: 2, gap: 19 }, { max: 746, perView: 2, gap: 10 }]}
                        gap={17.5}
                        innerClass="pl-2.5 max-[1201px]:pr-2.5"
                        listClass="min-h-75 pt-2.5 pb-5 max-[681px]:pt-3.75 max-[601px]:min-h-0"
                        renderItem={(brand, _index, visible) => (
                            <div className={`mb-3.75 rounded-[10px] px-6.25 pt-12.5 pb-7 text-center max-[601px]:px-2.5 max-[601px]:pt-6 max-[601px]:pb-4 ${visible ? "shadow-[5px_5px_15px_0px_rgba(0,0,0,0.149)]" : ""}`}>
                                <BrandCard brand={brand} />
                            </div>
                        )}
                    />
                </div>
                {/* Phones: the app's slider, about 3.6 small cards on screen at any phone width. */}
                <div className="hidden max-[601px]:-mx-8.75 max-[601px]:block max-[401px]:-mx-3.75 max-[251px]:-mx-2.5">
                    <SwipeSlider
                        items={brands}
                        itemKey={(brand) => brand.name}
                        trackClass="scroll-pl-[2vw] pl-[2vw]"
                        slidePadding="pt-1 pb-2.5 pr-[1.64vw]"
                        slideClass="w-[27.32vw]"
                        renderItem={(brand) => <BrandMiniCard brand={brand} />}
                    />
                </div>
                {viewAll && (
                    <a href={viewAll} className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
                )}
            </div>
        </>
    )
}
