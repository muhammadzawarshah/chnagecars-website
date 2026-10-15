"use client"

import Image from "next/image"
import { useState } from "react"

export default function DealerLogo({ name, src, large = false }: { name: string, src?: string | null, large?: boolean }) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)
    const url = src?.trim()
    const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase() || "D"

    return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e3dfd6] bg-white ${large ? "size-24" : "size-12"}`}>
        {url && url !== failedSrc
            ? <Image src={url} alt={`${name} logo`} width={large ? 96 : 48} height={large ? 96 : 48} unoptimized loading="lazy" onError={() => setFailedSrc(url)} className="h-full w-full object-contain p-1" />
            : <span aria-hidden="true" className="text-sm font-bold text-gold">{initials}</span>}
    </span>
}
