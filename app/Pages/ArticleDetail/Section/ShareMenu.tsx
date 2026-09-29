"use client"

import { useEffect, useRef, useState } from "react"

const targets = [
    { label: "Email", color: "bg-gold", href: (url: string, title: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, path: "M2 4h12v8H2zM2 4l6 5 6-5" },
    { label: "Facebook", color: "bg-[#3b5998]", href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, path: "M9 14V8.5h2l.3-2.2H9V5c0-.6.2-1 1-1h1.3V2.1C11 2 10.4 2 9.8 2 8.1 2 7 3 7 4.8v1.5H5v2.2h2V14" },
    { label: "WhatsApp", color: "bg-[#1ca811]", href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, path: "M3 13l.8-2.6A5.5 5.5 0 1 1 6 12.4zM6.2 5.6c.2 1.9 1.9 3.7 4 4" },
    { label: "X", color: "bg-black", href: (url: string, title: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, path: "M3 3l10 10M13 3L3 13" },
    { label: "LinkedIn", color: "bg-[#0a66c2]", href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, path: "M4 6.5V13M4 3.5v.1M7 13V6.5M7 9.3c0-1.7 1-2.8 2.4-2.8S12 7.4 12 9.3V13" },
];

export default function ShareMenu({ title }: { title: string }) {

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
            <div ref={ref} className="relative">
                <button type="button" onClick={toggle} aria-expanded={open} className="flex h-8 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 font-sans text-base font-semibold text-ink">
                    Share
                    <svg width="22" height="22" viewBox="0 0 16 17" fill="#957e4d"><circle cx="13" cy="3" r="2.6" /><circle cx="3" cy="8.5" r="2.6" /><circle cx="13" cy="14" r="2.6" /><path d="M3 8.5l10-5.5M3 8.5l10 5.5" stroke="#957e4d" strokeWidth="1.3" /></svg>
                </button>
                {open && (
                    <ul className="absolute top-full right-0 z-10 m-0 mt-1.5 flex list-none gap-3 rounded border border-[#f5f5f5] bg-white p-2.5 shadow-[0_3px_6px_rgba(0,0,0,0.2)]">
                        {targets.map((target) => (
                            <li key={target.label}>
                                <a href={target.href(url, title)} target="_blank" rel="noopener" aria-label={`Share on ${target.label}`} className={`flex size-6.5 items-center justify-center rounded-sm transition hover:scale-110 ${target.color}`}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={target.path} /></svg>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}
