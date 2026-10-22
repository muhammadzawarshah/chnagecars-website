"use client"

import { useEffect, useRef, useState } from "react"

// A dealer or brand logo; when it is missing or cannot be loaded, the name's first letter instead.
export default function LogoImage({ src, name, className = "" }: { src?: string | null, name: string, className?: string }) {
    const [failed, setFailed] = useState(false)
    const image = useRef<HTMLImageElement>(null)
    // An image can fail before the page is interactive, when onError is not yet listening.
    useEffect(() => {
        const element = image.current
        if (element?.complete && element.naturalWidth === 0) queueMicrotask(() => setFailed(true))
    }, [])
    if (!src || failed) return <span className="font-sans text-xl font-black text-gold">{name.trim()[0]?.toUpperCase()}</span>
    return <img ref={image} src={src} alt="" className={className} onError={() => setFailed(true)} />
}
