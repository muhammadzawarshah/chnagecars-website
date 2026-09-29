"use client"

import { useEffect, useRef, useState } from "react"

const targets = [
    { label: "Email", icon: "/img/article/icon-mail.svg", size: "", href: (url: string) => `mailto:?subject=${encodeURIComponent("I wanted to share this post with you")}&body=${encodeURIComponent(`Please have a look at this post ${url}`)}` },
    { label: "Facebook", icon: "/img/article/icon-facebook.svg", size: "", href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "WhatsApp", icon: "/img/article/icon-whatsapp.svg", size: "", href: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}` },
    { label: "X", icon: "/img/article/icons-twitterx.svg", size: "bg-size-[33px_33px]", href: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { label: "LinkedIn", icon: "/img/article/icons-linkedin.svg", size: "bg-size-[33px_33px]", href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
];

export default function ShareMenu({ title, className = "float-right mt-2.75" }: { title: string, className?: string }) {

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

    return (
        <>
            <div ref={ref} className={`relative font-sans ${className}`}>
                <button type="button" onClick={toggle} aria-expanded={open} className="block h-8 cursor-pointer border-0 bg-[url(/img/article/share-icon.svg)] bg-contain bg-right bg-no-repeat p-0 pr-13 text-base leading-8 font-normal text-ink">Share</button>
                {open && (
                    <div className="absolute top-full right-0 z-10 w-50.5 bg-white p-2.5 shadow-[0_3px_6px_rgba(0,0,0,0.2)]">
                        <ul className="m-0 flex list-none p-0">
                            {targets.map((target, index) => (
                                <li key={target.label}>
                                    <a
                                        href={target.href(url, title)}
                                        target="_blank"
                                        rel="noopener"
                                        aria-label={`Share on ${target.label}`}
                                        className={`block h-6.25 w-6.25 bg-center bg-no-repeat transition hover:scale-110 ${target.size} ${index === 0 ? "mr-3.25 ml-px w-6.5" : index < targets.length - 1 ? "mr-3.25" : ""}`}
                                        style={{ backgroundImage: `url(${target.icon})` }}
                                    ></a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    )
}
