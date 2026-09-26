"use client"

import { useEffect, useState } from "react"
import { usePopup } from "./Popups/PopupContext"

export default function FloatingButtons() {

    const { open } = usePopup();
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setShowTop(window.scrollY > 408);
        }
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    function scrollToTop() {
        const target = window.innerWidth <= 490 ? 140 : window.innerWidth <= 600 ? 90 : 0;
        const start = window.scrollY;
        const startTime = performance.now();
        function step(now: number) {
            const progress = Math.min((now - startTime) / 1500, 1);
            window.scrollTo(0, start + (target - start) * (0.5 - Math.cos(progress * Math.PI) / 2));
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    return (
        <>
            <a
                onClick={scrollToTop}
                className={`fixed right-8.25 bottom-61.25 z-79 size-11.25 cursor-pointer rounded-[10px] border-2 border-[#957e4e] bg-ink bg-[url(/img/back-to-top-btn.svg)] bg-size-[100%] bg-center bg-no-repeat transition-all duration-500 ease-[ease] hover:scale-[1.03] min-[1024px]:hover:opacity-70 max-[537px]:bottom-41.25 ${showTop ? "block" : "hidden"}`}
            ></a>
            <div
                onClick={() => open("help")}
                className="fixed right-13.5 bottom-21.75 z-39 block cursor-pointer rounded-full bg-gold py-2 pr-11.25 pl-4 text-center text-sm font-bold whitespace-nowrap text-white max-[537px]:right-12.5 max-[537px]:bottom-16.25 max-[537px]:py-1.25 max-[537px]:text-[11px]"
            >
                Help
            </div>
            <div
                onClick={() => open("help")}
                className="fixed right-4.25 bottom-16.25 z-40 size-19 cursor-pointer rounded-full bg-[#957e4e] transition duration-500 before:absolute before:top-3.75 before:left-3.75 before:block before:size-11.5 before:animate-wheel before:bg-[url(/img/car-tire-png-464.png)] before:bg-contain before:bg-center before:bg-no-repeat before:content-[''] after:absolute after:top-9.5 after:left-10 after:block after:h-8.5 after:w-13.25 after:animate-wheel-smoke after:bg-[url(/img/smoke.png)] after:bg-contain after:bg-center after:bg-no-repeat after:content-[''] max-[537px]:right-7.5 max-[537px]:bottom-12.5 max-[537px]:size-12.5 max-[537px]:before:top-2.5 max-[537px]:before:left-2.5 max-[537px]:before:size-7.5 max-[537px]:after:top-4 max-[537px]:after:left-6.25 max-[537px]:after:size-10"
            ></div>
        </>
    )
}
