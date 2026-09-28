"use client"

import { useRef, useState } from "react"
import Dots from "../../../components/Dots"
import { ctas } from "../Data/blocks"
import CtaCard from "./CtaCard"

export default function CtaSlider() {

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
            <div className="mt-7.5 hidden max-[601px]:block">
                <div ref={trackRef} onScroll={handleScroll} className="scrollbar-none flex snap-x snap-mandatory items-start overflow-x-auto">
                    {ctas.map((cta) => (
                        <div key={cta.title} className="w-full shrink-0 snap-start px-2.5 pt-2.5 pb-5">
                            <CtaCard cta={cta} slide />
                        </div>
                    ))}
                </div>
                <Dots positions={ctas.map((_, index) => index)} current={current} onSelect={goTo} />
            </div>
        </>
    )
}
