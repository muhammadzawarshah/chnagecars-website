import { Ad, bottomAd, dealersAd, heroAd } from "@/app/Pages/Home/Data/ads"
import { Special, specials as sampleSpecials } from "@/app/Pages/Home/Data/blocks"
import { Dealer, dealers as sampleDealers } from "@/app/Pages/Home/Data/dealers"
import { Testimonial, testimonials as sampleTestimonials } from "@/app/Pages/Home/Data/testimonials"
import { backendEnabled, publicGet, softly } from "../backend/client"

// Home page content managed in the super admin console: advert banners, testimonials,
// featured dealers and specials. With API_URL set it comes from the API (content and
// promotions); without it the site keeps showing the sample data in Pages/Home/Data.

export type AdPlacement = "hero" | "dealers" | "bottom"
export type HomeAds = Partial<Record<AdPlacement, Ad>>
export type FeaturedDealer = Dealer & { dealerId?: string | null }

type ApiAd = { placement: "HOME_HERO" | "HOME_DEALERS" | "HOME_BOTTOM", title: string, imageUrl: string, linkUrl: string | null, altText: string | null }
type ApiTestimonial = { name: string, text: string }
type ApiFeaturedDealer = { name: string, slug: string, logoUrl: string | null, description: string | null, about: string | null, dealerId: string | null }
type ApiPromotion = { title: string, slug: string, description: string | null, bannerUrl: string | null }

const PLACEMENTS: Record<ApiAd["placement"], AdPlacement> = { HOME_HERO: "hero", HOME_DEALERS: "dealers", HOME_BOTTOM: "bottom" }

const toDealer = (row: ApiFeaturedDealer): FeaturedDealer => ({
    name: row.name, slug: row.slug, logo: row.logoUrl ?? "", href: `/featured-dealer/${row.slug}`,
    description: row.description ?? "", about: (row.about ?? "").split("\n"), dealerId: row.dealerId,
})
const toSpecial = (row: ApiPromotion): Special => ({ title: row.title, slug: row.slug, image: row.bannerUrl ?? "", text: row.description ?? "", href: `/specials/${row.slug}` })

// One banner per place: the API lists running banners in order, so the first one wins.
export async function getHomeAds(): Promise<HomeAds> {
    if (!backendEnabled()) return { hero: heroAd, dealers: dealersAd, bottom: bottomAd }
    return softly("ad banners", async () => {
        const ads: HomeAds = {}
        for (const row of (await publicGet<ApiAd[]>("/content/ad-banners", { revalidate: 120 })) ?? []) {
            const place = PLACEMENTS[row.placement]
            if (place && !ads[place]) ads[place] = { href: row.linkUrl ?? "", image: row.imageUrl, alt: row.altText || row.title }
        }
        return ads
    }, {})
}

export async function getTestimonials(): Promise<Testimonial[]> {
    if (!backendEnabled()) return sampleTestimonials
    return softly("testimonials", async () => ((await publicGet<ApiTestimonial[]>("/content/testimonials", { revalidate: 300 })) ?? []).map(({ name, text }) => ({ name, text })), [])
}

export async function getFeaturedDealers(): Promise<FeaturedDealer[]> {
    if (!backendEnabled()) return sampleDealers
    return softly("featured dealers", async () => ((await publicGet<ApiFeaturedDealer[]>("/content/featured-dealers", { revalidate: 300 })) ?? []).map(toDealer), [])
}

export async function getFeaturedDealer(slug: string): Promise<FeaturedDealer | undefined> {
    if (!backendEnabled()) return sampleDealers.find((dealer) => dealer.slug === slug)
    if (!/^[a-z0-9-]{1,160}$/.test(slug)) return undefined
    const row = await publicGet<ApiFeaturedDealer>(`/content/featured-dealers/${slug}`, { revalidate: 300 })
    return row && toDealer(row)
}

export async function getSpecials(): Promise<Special[]> {
    if (!backendEnabled()) return sampleSpecials
    return softly("specials", async () => ((await publicGet<ApiPromotion[]>("/promotions", { revalidate: 120 })) ?? []).map(toSpecial), [])
}

export async function getSpecial(slug: string): Promise<Special | undefined> {
    if (!backendEnabled()) return sampleSpecials.find((special) => special.slug === slug)
    if (!/^[\w-]{1,200}$/.test(slug)) return undefined
    const result = await publicGet<{ promotion: ApiPromotion }>(`/promotions/${slug}?pageSize=1`, { revalidate: 120 })
    return result && toSpecial(result.promotion)
}

// ───────────── information pages, FAQs, videos ─────────────

export type ContentBlock =
    | { type: "paragraph" | "quote", text: string }
    | { type: "heading", text: string, level?: number }
    | { type: "list", items: string[] }
    | { type: "image", src: string, alt?: string }
    | { type: "link", text: string, href: string }
    | { type: "video", url: string }
export type StaticPage = { slug: string, title: string, body: ContentBlock[], metaTitle?: string | null, metaDescription?: string | null }
export type Faq = { id: string, question: string, answer: string, category: string | null }
export type MediaItem = { id: string, type: "VIDEO" | "PODCAST", title: string, slug: string, description: string | null, url: string, thumbnailUrl: string | null, publishedAt: string | null }
export type MediaPage = { items: MediaItem[], page: number, pageCount: number, total: number }

// A published information page (privacy policy, insurance, EV charging…) from the super admin console.
export async function getStaticPage(slug: string): Promise<StaticPage | undefined> {
    if (!backendEnabled() || !/^[a-z0-9-]{1,120}$/.test(slug)) return undefined
    return softly(`page ${slug}`, () => publicGet<StaticPage>(`/content/pages/${slug}`, { revalidate: 300 }), undefined)
}

export async function getFaqs(): Promise<Faq[]> {
    if (!backendEnabled()) return []
    return softly("FAQs", async () => (await publicGet<Faq[]>("/content/faqs", { revalidate: 300 })) ?? [], [])
}

export async function getMedia(page = 1): Promise<MediaPage> {
    const empty: MediaPage = { items: [], page: 1, pageCount: 1, total: 0 }
    if (!backendEnabled()) return empty
    return softly("videos and podcasts", async () => {
        const result = await publicGet<{ data: MediaItem[], meta: { page: number, pageCount: number, total: number } }>(`/content/media?page=${Math.max(1, Math.floor(page))}&pageSize=24`, { revalidate: 300 })
        return result ? { items: result.data, page: result.meta.page, pageCount: result.meta.pageCount, total: result.meta.total } : empty
    }, empty)
}
