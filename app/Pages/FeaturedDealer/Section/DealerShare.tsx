"use client"

import { useEffect, useRef, useState } from "react"

export default function DealerShare() {

    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function toggle() {
        setUrl(window.location.href);
        setOpen(!open);
    }

    const icon = "block size-6.25 rounded-[5px] bg-center bg-no-repeat transition duration-200 hover:scale-110";
    const link = encodeURIComponent(url);

    return (
        <>
            <div ref={ref} className="relative">
                <button type="button" onClick={toggle} aria-expanded={open} className="relative block h-8 cursor-pointer border-0 bg-transparent bg-[url(/img/featured-dealer/share-icon-white.svg)] bg-contain bg-right bg-no-repeat p-0 pr-13 font-sans text-base leading-8 text-white max-[862px]:top-3.25">Share</button>
                {open && (
                    <div className="absolute -top-1.5 right-[calc(100%+15px)] z-2 w-49.5 rounded-sm border border-[#f5f5f5] bg-white p-2.5 text-center shadow-[0_3px_6px_rgba(0,0,0,0.2)] max-[1101px]:right-27.25 max-[862px]:top-1.5">
                        <ul className="m-0 flex w-full list-none justify-between overflow-hidden p-0">
                            <li><a href={`mailto:?subject=${encodeURIComponent("I wanted to share this car with you ")}&body=${encodeURIComponent("Please have a look at this car ")}${link}`} aria-label="Share by email" className={`${icon} ml-px w-6.5 bg-gold bg-[url(/img/article/icon-mail.svg)]`}></a></li>
                            <li><a href={`https://wa.me/?text=${link}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp" className={`${icon} bg-[#1ca811] bg-[url(/img/article/icon-whatsapp.svg)]`}></a></li>
                            <li><a href={`https://www.facebook.com/sharer/sharer.php?u=${link}`} target="_blank" rel="noopener" aria-label="Share on Facebook" className={`${icon} bg-[#3b5998] bg-[url(/img/article/icon-facebook.svg)]`}></a></li>
                            <li><a href={`https://twitter.com/intent/tweet?url=${link}`} target="_blank" rel="noopener" aria-label="Share on X" className={`${icon} bg-[url(/img/article/icons-twitterx.svg)] bg-size-[33px_33px]`}></a></li>
                            <li><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`} target="_blank" rel="noopener" aria-label="Share on LinkedIn" className={`${icon} mr-px bg-[url(/img/article/icons-linkedin.svg)] bg-size-[33px_33px]`}></a></li>
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
