import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getStaticPage } from "../lib/content/api"
import ContentBlocks from "./ContentBlocks"
import InfoLayout from "./InfoLayout"

// An information page written in the super admin console (Content → Information pages). Until one
// is published under this slug, visitors go to the same page on the current live site.
const LIVE_SITE = "https://www.changecars.co.za"

export async function staticPageMetadata(slug: string): Promise<Metadata> {
    const page = await getStaticPage(slug)
    return page ? { title: page.metaTitle || `${page.title} | CHANGECARS`, description: page.metaDescription ?? undefined } : {}
}

export default async function StaticInfoPage({ slug, livePath }: { slug: string, livePath: string }) {
    const page = await getStaticPage(slug)
    if (!page) redirect(`${LIVE_SITE}${livePath}`)
    return <InfoLayout title={page.title}><ContentBlocks blocks={page.body} /></InfoLayout>
}
