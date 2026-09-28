"use client"

import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import Dots from "./Dots"

type SwipeSliderProps<T> = {
    items: T[]
    itemKey: (item: T) => string
    renderItem: (item: T) => ReactNode
    slideClass?: string
}

export default function SwipeSlider<T>({ items, itemKey, renderItem, slideClass = "w-full" }: SwipeSliderProps<T>) {

    const trackRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(items.length);

    const step = useCallback(() => {
        const slide = trackRef.current?.firstElementChild as HTMLElement | null;
        return slide ? slide.offsetWidth : 1;
    }, []);

    const measure = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        setCount(Math.round((track.scrollWidth - track.clientWidth) / step()) + 1);
        setCurrent(Math.round(track.scrollLeft / step()));
    }, [step]);

    function goTo(position: number) {
        trackRef.current?.scrollTo({ left: position * step(), behavior: "smooth" });
    }

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    return (
        <>
            <div ref={trackRef} onScroll={measure} className="scrollbar-none flex snap-x snap-mandatory items-stretch overflow-x-auto">
                {items.map((item) => (
                    <div key={itemKey(item)} className={`shrink-0 snap-start px-2.5 pt-2.5 pb-5 ${slideClass}`}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
            {count > 1 && <Dots positions={Array.from({ length: count }, (_, index) => index)} current={current} onSelect={goTo} />}
        </>
    )
}
