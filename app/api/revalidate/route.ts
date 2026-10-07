import { revalidateTag } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { CACHE_TAGS, CacheTag } from "@/app/lib/backend/client"

// The API calls this whenever public data changes (a car published, a price edited, an article
// published, a dealer approved…), so cached pages show the change on the very next visit.
// Only the API can call it: it must send the shared WEB_ADAPTER_KEY.

function sameSecret(given: string, expected: string) {
    const a = Buffer.from(given)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
    const expected = process.env.WEB_ADAPTER_KEY
    const given = request.headers.get("x-web-adapter-key") ?? ""
    if (!expected || !sameSecret(given, expected)) {
        return Response.json({ ok: false, message: "Not allowed" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { tags?: unknown }
    const tags = (Array.isArray(body.tags) ? body.tags : []).filter((tag): tag is CacheTag => CACHE_TAGS.includes(tag as CacheTag))
    if (!tags.length) return Response.json({ ok: false, message: "No known tags" }, { status: 400 })

    // expire: 0 — the next visitor gets fresh data, never the old copy.
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    return Response.json({ ok: true, revalidated: tags })
}
