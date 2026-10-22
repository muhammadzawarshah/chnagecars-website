"use client"

import { useState } from "react"
import { input } from "../ui/format"
import { websiteImage } from "@/app/lib/site"

// An image link with a live preview, for banners, logos, photos and thumbnails.
export default function ImageField({ name, label, value = "", required = false, hint, wide = false }: { name: string, label: string, value?: string, required?: boolean, hint?: string, wide?: boolean }) {
    const [src, setSrc] = useState(value)
    const [broken, setBroken] = useState(false)
    const usable = /^(https:\/\/|\/)\S+$/i.test(src)
    return (
        <label className="grid gap-1 text-sm">
            <span className="flex items-baseline justify-between gap-2">{label}{hint && <span className="text-xs text-[#6b6862]">{hint}</span>}</span>
            <input className={input} name={name} defaultValue={value} required={required} placeholder="https://… or /images/…" maxLength={2000}
                onChange={(event) => { setSrc(event.target.value.trim()); setBroken(false) }} />
            <span className={`flex items-center justify-center overflow-hidden rounded-lg border border-[#ebe8e1] bg-[#f7f5f0] ${wide ? "aspect-[4/1]" : "aspect-[16/9] max-h-40"}`}>
                {usable && !broken
                    // eslint-disable-next-line @next/next/no-img-element -- preview of any host
                    ? <img src={websiteImage(src)} alt="" className="h-full w-full object-contain" onError={() => setBroken(true)} />
                    : <span className="px-3 text-center text-xs text-[#6b6862]">{broken ? "This image could not be loaded. Check the link." : "Paste an image link to see a preview"}</span>}
            </span>
        </label>
    )
}
