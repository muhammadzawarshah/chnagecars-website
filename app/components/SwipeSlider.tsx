"use client"

import { ReactNode, useRef, useState } from "react"
import Dots from "./Dots"

type SwipeSliderProps<T> = {
    items: T[]
    itemKey: (item: T) => string
    renderItem: (item: T) => ReactNode
}

export default function SwipeSlider<T>({ items, itemKey, renderItem }: SwipeSliderProps<T>) {

    const trackRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);

    function handleScroll() {
        const track = trackRef.current;
        if (track) setCurrent(Math.round(track.scrollLeft / track.clientWidth));
    }

    function goTo(position: number) {
        trackRef.current?.scrollTo({ left: position * trackRef.current.clientWidth, behavior: "smooth" });
    }

    return (
        <>
            <div ref={trackRef} onScroll={handleScroll} className="scrollbar-none flex snap-x snap-mandatory items-stretch overflow-x-auto">
                {items.map((item) => (
                    <div key={itemKey(item)} className="w-full shrink-0 snap-start px-2.5 pt-2.5 pb-5">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
            <Dots positions={items.map((_, index) => index)} current={current} onSelect={goTo} />
        </>
    )
}
