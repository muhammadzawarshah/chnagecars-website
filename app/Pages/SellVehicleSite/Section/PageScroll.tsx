"use client"

import { useEffect } from "react"

// Like the live page: glide down to the form over 1.5s with jQuery's "swing" easing.
export default function PageScroll() {

    useEffect(() => {
        const width = window.innerWidth;
        const target = width <= 500 ? 180 : width <= 1110 ? 170 : width <= 1214 ? 190 : 160;
        const start = window.scrollY;
        const began = performance.now();
        let frame = 0;

        function step(now: number) {
            const progress = Math.min((now - began) / 1500, 1);
            window.scrollTo(0, start + (target - start) * (0.5 - Math.cos(progress * Math.PI) / 2));
            if (progress < 1) frame = requestAnimationFrame(step);
        }

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, []);

    return null
}
