"use client"

import { createContext, ReactNode, useContext } from "react"
import type { AdPlacement, HomeAds } from "../lib/content/api"

// The advert banners running now, loaded once by the site layout (app/(site)/layout.tsx).
const AdsContext = createContext<HomeAds>({})

export function AdsProvider({ ads, children }: { ads: HomeAds, children: ReactNode }) {
    return <AdsContext.Provider value={ads}>{children}</AdsContext.Provider>
}

export function useAd(placement: AdPlacement) {
    return useContext(AdsContext)[placement]
}
