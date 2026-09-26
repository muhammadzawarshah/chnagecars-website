"use client"

import { useRef } from "react"
import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { quickBlocks } from "../Data/blocks"
import { makes } from "../Data/makes"

const site = "https://www.changecars.co.za/new-or-used-cars-for-sale";

export default function QuickSearch() {

    const scrollRef = useRef<HTMLDivElement>(null);

    function scroll(direction: number) {
        scrollRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
    }

    const arrow = "z-3 h-7.5 w-10 shrink-0 cursor-pointer rounded-[5px] bg-black bg-center bg-no-repeat";

    return (
        <>
            <section className="m-0 -mt-px overflow-hidden bg-white px-8.75 pt-25 max-[901px]:pt-11.25">
                <SectionTitle className="mb-12.5 max-[1000px]:mb-6.25">Quick <strong>Search</strong></SectionTitle>

                <div className="relative -mt-px bg-white pb-25">
                    <div className="mx-auto w-full max-w-350 overflow-hidden px-5 pt-5 max-[1001px]:pb-0 max-[801px]:px-0 min-[1000px]:pt-0">
                        <div className="relative flex items-center justify-center gap-3.75 overflow-hidden before:absolute before:top-0 before:left-0 before:z-2 before:h-full before:w-30 before:bg-linear-to-l before:from-white/0 before:to-white before:to-92% before:content-[''] after:absolute after:top-0 after:right-0 after:z-2 after:h-full after:w-30 after:bg-linear-to-r after:from-white/0 after:to-white after:to-92% after:content-[''] max-[801px]:before:w-10 max-[801px]:after:w-10">
                            <a onClick={() => scroll(-1)} className={`${arrow} bg-[url(/img/prev-icon.svg)]`}></a>
                            <div ref={scrollRef} className="-mb-6.25 flex w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-6.25 min-[800px]:overflow-x-hidden">
                                <ul className="m-0 mr-3.75 flex shrink-0 list-none gap-3.75 p-0">
                                    <li className="shrink-0 rounded-[5px] border border-coal/28">
                                        <a href={`${site}/`} className="block cursor-pointer px-3.75 py-2.5 text-base text-coal no-underline">All <span className="font-bold text-gold">(38807)</span></a>
                                    </li>
                                    {makes.map((make, index) => (
                                        <li key={`${make.name}-${index}`} className="shrink-0 rounded-[5px] border border-coal/28">
                                            <a href={`${site}/${make.slug}`} className="block cursor-pointer px-3.75 py-2.5 text-base text-coal no-underline">
                                                {make.name} <span className="font-bold text-gold">({make.count})</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <a onClick={() => scroll(1)} className={`${arrow} bg-[url(/img/next-icon.svg)]`}></a>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-350">
                    <Carousel
                        items={quickBlocks}
                        renderItem={(item) => (
                            <a href={item.href} className="block cursor-pointer no-underline">
                                <h4 className="m-0 block h-8.75 overflow-hidden rounded-t-[10px] bg-gold px-2.5 text-center leading-8.75 font-bold whitespace-nowrap text-white">{item.title}</h4>
                                <div className="h-65 rounded-b-[10px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.image})` }}></div>
                            </a>
                        )}
                    />
                </div>
            </section>
        </>
    )
}
