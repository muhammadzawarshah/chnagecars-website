"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type PhotoViewerProps = {
    photos: string[]
    start: number
    title: string
    onClose: () => void
}

export default function PhotoViewer({ photos, start, title, onClose }: PhotoViewerProps) {

    const [index, setIndex] = useState(start);

    function move(step: number) {
        setIndex((current) => (current + step + photos.length) % photos.length);
    }

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        function handleKey(event: KeyboardEvent) {
            if (event.key === "ArrowRight") setIndex((current) => (current + 1) % photos.length);
            if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + photos.length) % photos.length);
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", handleKey);
        };
    }, [photos.length, onClose]);

    const arrow = "absolute top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-black/40 text-white";

    return createPortal(
        <>
            <div className="fixed inset-0 z-1000 flex flex-col bg-black font-roboto">
                <div className="flex h-14 shrink-0 items-center px-4">
                    <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M1 1l12 12M13 1L1 13" /></svg>
                    </button>
                </div>
                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                    <img src={photos[index]} alt={`${title} photo ${index + 1}`} className="max-h-full max-w-full object-contain" />
                    {photos.length > 1 && (
                        <>
                            <button type="button" onClick={() => move(-1)} aria-label="Previous photo" className={`${arrow} left-3`}>
                                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M15 7H2M7 1.5L1.5 7 7 12.5" /></svg>
                            </button>
                            <button type="button" onClick={() => move(1)} aria-label="Next photo" className={`${arrow} right-3`}>
                                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M1 7h13M9 1.5L14.5 7 9 12.5" /></svg>
                            </button>
                        </>
                    )}
                </div>
                <p className="m-0 flex h-14 shrink-0 items-center justify-center text-[15px] text-white">{index + 1}/{photos.length}</p>
            </div>
        </>,
        document.body
    )
}
