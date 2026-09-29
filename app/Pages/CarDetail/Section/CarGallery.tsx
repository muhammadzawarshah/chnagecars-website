"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import PhotoViewer from "./PhotoViewer"
import CompareButton from "../../../components/Compare/CompareButton"
import { CompareCar } from "../../../components/Compare/compareStore"

type CarGalleryProps = {
    compare: CompareCar
    photos: string[]
    photoCount: number
    title: string
}

export default function CarGallery({ compare, photos, photoCount, title }: CarGalleryProps) {

    const [active, setActive] = useState(0);
    const [viewer, setViewer] = useState(false);
    const [bar, setBar] = useState({ top: 0, height: 100 });
    const list = useRef<HTMLUListElement>(null);

    function move(step: number) {
        setActive((current) => (current + step + photos.length) % photos.length);
    }

    function updateBar() {
        const el = list.current;
        if (!el) return;
        const height = Math.min(100, (el.clientHeight / el.scrollHeight) * 100);
        const top = el.scrollHeight > el.clientHeight ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * (100 - height) : 0;
        setBar({ top, height });
    }

    useEffect(() => {
        updateBar();
        window.addEventListener("resize", updateBar);
        return () => window.removeEventListener("resize", updateBar);
    }, []);

    const overlay = "absolute bottom-3.25 z-2 flex h-6.5 items-center rounded-[5px] text-xs leading-6.5 no-underline";
    const arrow = "absolute top-1/2 z-2 -mt-3.75 size-7.5 cursor-pointer rounded-full border-2 border-white bg-black bg-center bg-no-repeat p-0";

    return (
        <>
            <div className="mb-3 flex gap-2.5 max-[1038px]:block">
                <div className="relative h-112.5 min-w-0 flex-1 bg-[#eee] bg-cover bg-center bg-no-repeat max-[1038px]:h-75 max-[600px]:h-62.5" style={{ backgroundImage: `url(${photos[active]})` }}>
                    <button type="button" onClick={() => setViewer(true)} aria-label={`View ${title} photos`} className="absolute inset-0 z-1 cursor-zoom-in border-0 bg-transparent p-0"></button>
                    <button type="button" onClick={() => setViewer(true)} aria-label="Zoom" className="absolute top-2.5 right-6 z-2 h-6.5 w-8 cursor-pointer rounded-[5px] border-0 bg-white/80 bg-[url(/img/car-detail/orig/Icon-magnifying-glass.svg)] bg-center bg-no-repeat p-0"></button>
                    {photos.length > 1 && (
                        <>
                            <button type="button" onClick={() => move(-1)} aria-label="Previous photo" className={`${arrow} left-2.5 bg-[url(/img/car-detail/orig/prev-icon.svg)]`}></button>
                            <button type="button" onClick={() => move(1)} aria-label="Next photo" className={`${arrow} right-2.5 bg-[url(/img/car-detail/orig/next-icon.svg)]`}></button>
                        </>
                    )}
                    <span className={`${overlay} left-3.25 bg-white bg-[url(/img/car-detail/orig/icon-camara.svg)] bg-position-[8px_50%] bg-no-repeat pr-1.5 pl-7.5 text-ink`}>{photoCount}</span>
                    <Link href="/login" className={`${overlay} right-27.25 bg-[#ce2127] px-2.5 text-white shadow-[0.67px_5.87px_23px_rgba(0,0,0,0.1)]`}>
                        <img src="/img/car-detail/orig/track-price-icon.svg" alt="" className="mr-1.25 size-2.75" />
                        Track price
                    </Link>
                    <CompareButton car={compare} className={`${overlay} right-3.75 bg-white px-2.5 text-black shadow-[0.67px_5.87px_23px_rgba(0,0,0,0.1)]`}>
                        <img src="/img/car-detail/orig/compare-add-icon.svg" alt="" className="mr-1.25 size-2.75" />
                        Compare
                    </CompareButton>
                </div>
                <div className="relative h-112.5 w-40 shrink-0 overflow-hidden max-[1038px]:mt-1.75 max-[1038px]:h-auto max-[1038px]:w-full">
                    <ul ref={list} onScroll={updateBar} className="m-0 -mr-5.25 h-full list-none overflow-y-scroll p-0 max-[1038px]:mr-0 max-[1038px]:flex max-[1038px]:gap-1.75 max-[1038px]:overflow-x-auto max-[1038px]:overflow-y-hidden max-[1038px]:[scrollbar-width:none]">
                        {photos.map((photo, index) => (
                            <li key={index} className="mb-1.75 last:mb-0 max-[1038px]:mb-0 max-[1038px]:shrink-0">
                                <button type="button" onClick={() => setActive(index)} aria-label={`${title} photo ${index + 1}`} className="block h-27.5 w-41.5 cursor-pointer border-0 bg-cover bg-center bg-no-repeat p-0 max-[1038px]:h-17.5 max-[1038px]:w-27.5" style={{ backgroundImage: `url(${photo})` }}></button>
                            </li>
                        ))}
                    </ul>
                    {bar.height < 100 && (
                        <span className="absolute top-0 right-0 h-full w-1.75 bg-black/50 max-[1038px]:hidden">
                            <span className="relative block w-full bg-gold" style={{ top: `${bar.top}%`, height: `${bar.height}%` }}></span>
                        </span>
                    )}
                </div>
            </div>
            {viewer && <PhotoViewer photos={photos} start={active} title={title} onClose={() => setViewer(false)} />}
        </>
    )
}
