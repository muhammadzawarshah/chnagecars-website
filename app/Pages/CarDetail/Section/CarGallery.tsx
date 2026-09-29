"use client"

import { useState } from "react"
import PhotoViewer from "./PhotoViewer"

export default function CarGallery({ photos, title }: { photos: string[], title: string }) {

    const [open, setOpen] = useState<number | null>(null);

    const thumbs = photos.slice(1, 5);

    return (
        <>
            <div>
                <button type="button" onClick={() => setOpen(0)} className="relative block w-full cursor-pointer overflow-hidden rounded-xl border-0 p-0">
                    <img src={photos[0]} alt={title} className="block aspect-[2.35] w-full object-cover" />
                    <span className="absolute top-2.5 right-2.5 flex h-6.5 items-center gap-1 rounded-md bg-white px-2 text-[13px] font-bold text-black">
                        <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#000" strokeWidth="1.2"><path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" /><circle cx="7" cy="7" r="2.3" /></svg>
                        {photos.length}
                    </span>
                </button>
                {thumbs.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 min-[981px]:mt-4 min-[981px]:gap-4">
                        {thumbs.map((photo, index) => {
                            const last = index === thumbs.length - 1 && photos.length > 5;
                            return (
                                <button key={photo} type="button" onClick={() => setOpen(last ? 0 : index + 1)} className="relative block cursor-pointer overflow-hidden rounded-xl border-0 p-0">
                                    <img src={photo} alt={`${title} photo ${index + 2}`} className="block aspect-[1.52] w-full object-cover" />
                                    {last && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                                            <span className="rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-white min-[981px]:text-sm">Show All</span>
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
            {open !== null && <PhotoViewer photos={photos} start={open} title={title} onClose={() => setOpen(null)} />}
        </>
    )
}
