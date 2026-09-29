"use client"

import { useState } from "react"
import PhotoViewer from "./PhotoViewer"

export default function CarGallery({ photos, title }: { photos: string[], title: string }) {

    const [open, setOpen] = useState<number | null>(null);

    const thumbs = photos.slice(1, 5);

    return (
        <>
            <div>
                <button type="button" onClick={() => setOpen(0)} className="block w-full cursor-pointer overflow-hidden rounded-[10px] border-0 p-0 min-[981px]:rounded-xl">
                    <img src={photos[0]} alt={title} className="block aspect-[1.64] w-full object-cover min-[981px]:aspect-[2.35]" />
                </button>
                {thumbs.length > 0 && (
                    <div className="mt-4.5 grid grid-cols-2 gap-x-4.5 gap-y-4 min-[981px]:mt-4 min-[981px]:gap-4">
                        {thumbs.map((photo, index) => {
                            const last = index === thumbs.length - 1 && photos.length >= 5;
                            return (
                                <button key={index} type="button" onClick={() => setOpen(last ? 0 : index + 1)} className="relative block cursor-pointer overflow-hidden rounded-[10px] border-0 p-0 min-[981px]:rounded-xl">
                                    <img src={photo} alt={`${title} photo ${index + 2}`} className="block aspect-[1.5] w-full object-cover" />
                                    {last && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                                            <span className="flex h-6.5 items-center rounded-md bg-gold px-2.5 text-xs font-medium text-white min-[981px]:h-8 min-[981px]:px-3 min-[981px]:text-sm">Show All</span>
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
