"use client"

import { ReactNode, useState } from "react"
import useWindowWidth from "./useWindowWidth"

type Breakpoint = {
    max: number
    perView: number
    gap?: number
}

type CarouselProps<T> = {
    items: T[]
    renderItem: (item: T, index: number, visible: boolean) => ReactNode
    perView?: number
    breakpoints?: Breakpoint[]
    gap?: number
    itemClass?: string
    innerClass?: string
    listClass?: string
    prevClass?: string
    nextClass?: string
    dots?: boolean
}

export const blockBreakpoints: Breakpoint[] = [
    { max: 1220, perView: 3 },
    { max: 1000, perView: 2 },
    { max: 600, perView: 1 },
];

export default function Carousel<T>({
    items,
    renderItem,
    perView = 4,
    breakpoints = blockBreakpoints,
    gap = 10,
    itemClass = "",
    innerClass = "",
    listClass = "",
    prevClass = "-top-11.5 right-12.5",
    nextClass = "-top-11.5 right-0",
    dots = false,
}: CarouselProps<T>) {

    const width = useWindowWidth();
    const [index, setIndex] = useState(0);

    const active = breakpoints
        .filter((point) => width <= point.max)
        .reduce<Breakpoint | null>((match, point) => (!match || point.max < match.max ? point : match), null);
    const visibleCount = active ? active.perView : perView;
    const itemGap = active?.gap ?? gap;
    const lastIndex = Math.max(items.length - visibleCount, 0);
    const current = Math.min(index, lastIndex);

    function next() {
        setIndex(current >= lastIndex ? 0 : current + 1);
    }

    function prev() {
        setIndex(current <= 0 ? lastIndex : current - 1);
    }

    const dotCount = Math.min(lastIndex + 1, 9);
    const dotStart = Math.min(Math.max(current - Math.floor(dotCount / 2), 0), lastIndex + 1 - dotCount);

    const arrow = "absolute z-5 h-7.5 w-10 cursor-pointer rounded-[5px] bg-black bg-center bg-no-repeat hover:opacity-90";

    return (
        <>
            <div className="relative">
                <a onClick={prev} className={`${arrow} ${prevClass} bg-[url(/img/prev-icon.svg)]`}></a>
                <a onClick={next} className={`${arrow} ${nextClass} bg-[url(/img/next-icon.svg)]`}></a>
                <div className={`relative w-[calc(100%+10px)] overflow-hidden ${innerClass}`}>
                    <ul
                        className={`m-0 flex list-none items-start p-0 transition-transform duration-500 ${listClass}`}
                        style={{ transform: `translateX(-${(current * 100) / visibleCount}%)` }}
                    >
                        {items.map((item, i) => (
                            <li
                                key={i}
                                className={`shrink-0 ${itemClass}`}
                                style={{ flexBasis: `calc(${100 / visibleCount}% - ${itemGap}px)`, marginRight: itemGap }}
                            >
                                {renderItem(item, i, i >= current && i < current + visibleCount)}
                            </li>
                        ))}
                    </ul>
                </div>
                {dots && (
                    <div className="mt-6.25 flex justify-center gap-2 max-[601px]:mt-5 max-[601px]:gap-1.5">
                        {Array.from({ length: dotCount }, (_, i) => dotStart + i).map((position) => (
                            <button
                                key={position}
                                onClick={() => setIndex(position)}
                                aria-label={`Go to slide ${position + 1}`}
                                className={`h-2 cursor-pointer rounded-full border-0 p-0 transition-all duration-300 max-[601px]:h-1.25 ${position === current ? "w-6 bg-[#957e4e] max-[601px]:w-3" : "w-2 bg-[#dcdcdc] max-[601px]:w-1.25"}`}
                            ></button>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
