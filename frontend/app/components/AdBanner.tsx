"use client"

import { useAd } from "./AdsContext"
import type { AdPlacement } from "../lib/content/api"

// The banner running in this place (managed in the super admin console); nothing when there is none.
export default function AdBanner({ placement, className }: { placement: AdPlacement, className: string }) {
    const ad = useAd(placement)
    if (!ad?.image) return null
    const image = <img src={ad.image} alt={ad.alt} className="block w-full" />
    return ad.href ? <a href={ad.href} target="_blank" rel="noopener" className={className}>{image}</a> : <span className={className}>{image}</span>
}
