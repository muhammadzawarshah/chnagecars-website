"use client"

import { useEffect, useRef } from "react"
import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { quickBlocks } from "../Data/blocks"
import QuickSearchList from "./QuickSearchList"

const step = 150;

export default function QuickSearch() {

    const scrollRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const pausedRef = useRef(false);

    function scroll(direction: number) {
        const box = scrollRef.current;
        const list = listRef.current;
        if (!box || !list) return;
        const loop = list.offsetWidth + 15;
        if (direction > 0 && box.scrollLeft + step >= loop) box.scrollTo({ left: box.scrollLeft - loop, behavior: "instant" });
        if (direction < 0 && box.scrollLeft - step < 0) box.scrollTo({ left: box.scrollLeft + loop, behavior: "instant" });
        box.scrollBy({ left: direction * step, behavior: "smooth" });
    }

    useEffect(() => {
        if (window.innerWidth < 800) return;
        const timer = setInterval(() => {
            if (!pausedRef.current) scroll(1);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const arrow = "z-3 h-7.5 w-10 shrink-0 cursor-pointer rounded-[5px] bg-black bg-center bg-no-repeat";

    return (
        <>
            <section className="m-0 -mt-px overflow-hidden bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5 pt-25 max-[901px]:pt-11.25">
                <SectionTitle className="mb-12.5 max-[1000px]:mb-6.25">Quick <strong>Search</strong></SectionTitle>

                <div onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }} className="relative -mt-px bg-white pb-25">
                    <div className="mx-auto w-full max-w-350 overflow-hidden px-5 pt-5 max-[1001px]:pb-0 max-[801px]:px-0 min-[1000px]:pt-0">
                        <div className="relative flex items-center justify-center gap-3.75 overflow-hidden before:absolute before:top-0 before:left-0 before:z-2 before:h-full before:w-30 before:bg-linear-to-l before:from-white/0 before:to-white before:to-92% before:content-[''] after:absolute after:top-0 after:right-0 after:z-2 after:h-full after:w-30 after:bg-linear-to-r after:from-white/0 after:to-white after:to-92% after:content-[''] max-[801px]:before:w-10 max-[801px]:after:w-10">
                            <a onClick={() => scroll(-1)} className={`${arrow} bg-[url(/img/prev-icon.svg)]`}></a>
                            <div ref={scrollRef} className="-mb-6.25 flex w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-6.25 min-[800px]:overflow-x-hidden">
                                <QuickSearchList listRef={listRef} />
                                <QuickSearchList />
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
