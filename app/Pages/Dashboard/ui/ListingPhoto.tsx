"use client"

import Image from "next/image"
import { useState } from "react"
import Icon from "./Icon"

export default function ListingPhoto({ src, title }: { src: string, title: string }) {
    const [failed, setFailed] = useState<string | null>(null)
    return <div className="relative aspect-[16/10] bg-[#f6f5f2]">
        {src && failed !== src
            ? <Image src={src} alt={title} fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" onError={() => setFailed(src)} className="object-cover" />
            : <div className="flex h-full items-center justify-center gap-2 text-sm text-[#6b6862]"><Icon name="listings" />No photo available</div>}
    </div>
}
