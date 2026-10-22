"use server"

import { revalidatePath } from "next/cache"
import { LEADS_ENABLED } from "./features"
import { redirect } from "next/navigation"
import { BackendError } from "../backend/client"
import { consoleWrite, requireSuperAdmin } from "./console"

export type ActionState = { error?: string, success?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const allowedActions = ["vehicle-update", "dealer-update", "user-update", "user-status", "invite", "retry-event", "refresh-snapshot", "make-create", "make-update", "model-create", "faq-create", "faq-update", "article-create", "article-status", "page-create", "page-status", "lead-assign", "lead-stage", "model-update", "variant-create", "variant-update", "category-create", "category-update", "faq-delete", "special-create", "special-update", "special-delete", "ad-create", "ad-update", "ad-delete", "testimonial-create", "testimonial-update", "testimonial-delete", "featured-create", "featured-update", "featured-delete", "media-create", "media-update", "media-delete"]

export async function manageConsole(_previous: ActionState, form: FormData): Promise<ActionState> {
    await requireSuperAdmin()
    const value = (key: string) => String(form.get(key) ?? "").trim()
    const action = value("action"), id = value("id")
    if (!allowedActions.includes(action) || (!LEADS_ENABLED && action.startsWith("lead-"))) return { error: "Unknown action" }
    if (id && !uuid.test(id) && !/^\d+$/.test(id)) return { error: "Invalid record ID" }
    const pick = (field: string, options: string[]) => { const v = value(field); if (!options.includes(v)) throw new Error(`Choose a valid ${field}`); return v }
    const needed = (field: string, max = 1000) => { const v = value(field); if (!v || v.length > max) throw new Error(`Enter a valid ${field}`); return v }
    // Dealers and vehicles keep their numeric DealerTrade IDs; the API checks each route's own format.
    const requiredId = () => { if (!uuid.test(id) && !/^\d+$/.test(id)) throw new Error("Record ID is required"); return id }
    // Website content fields (banners, testimonials, featured dealers, specials, videos, FAQs).
    const text = (field: string, max: number) => { const v = value(field).replace(/\r\n/g, "\n"); if (v.length > max) throw new Error(`${field} is too long`); return v || null }
    const link = (field: string, label: string, required = false) => {
        const v = value(field)
        if (!v) { if (required) throw new Error(`Enter the ${label}`); return null }
        if (v.length > 2000 || !/^(https:\/\/|\/)[^\s<>"']*$/i.test(v)) throw new Error(`The ${label} must start with https:// or /`)
        return v
    }
    const order = () => { const v = value("sortOrder"); if (!v) return 0; const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 100000) throw new Error("Order must be a whole number"); return n }
    const active = () => form.get("isActive") === "on"
    // datetime-local values are South African time.
    const sast = (field: string) => { const v = value(field); if (!v) return null; const d = new Date(`${v.length === 16 ? `${v}:00` : v}+02:00`); if (!Number.isFinite(d.getTime())) throw new Error(`Enter a valid ${field}`); return d.toISOString() }
    const dates = () => { const startsAt = sast("startsAt"), endsAt = sast("endsAt"); if (startsAt && endsAt && endsAt <= startsAt) throw new Error("Choose an end after the start"); return { startsAt, endsAt } }
    const write = (create: boolean, collection: string, body: Record<string, unknown>) => consoleWrite(create ? `/admin/${collection}` : `/admin/${collection}/${requiredId()}`, create ? "POST" : "PATCH", body)
    try {
        switch (action) {
            case "lead-assign": {
                const memberId = value("memberId"); if (memberId && !uuid.test(memberId)) throw new Error("Choose a dealer team member")
                await consoleWrite(`/admin/console/leads/${requiredId()}/assign`, "POST", { memberId: memberId || null }); break
            }
            case "lead-stage": {
                const stage = pick("stage", ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "OFFER_SENT", "WON", "LOST"])
                await consoleWrite(`/admin/console/leads/${requiredId()}/stage`, "POST", { stage, ...(stage === "LOST" ? { lostReason: needed("reason", 500) } : {}) }); break
            }
            case "user-status": await consoleWrite(`/admin/users/${requiredId()}/status`, "PATCH", { status: pick("status", ["ACTIVE", "SUSPENDED"]), reason: value("reason") }); break
            case "user-update": {
                // One dialog edits status and role; only what changed is sent.
                const current = value("currentStatus"), status = pick("status", [...new Set(["ACTIVE", "SUSPENDED", current])])
                const statusChanged = status !== current
                const roleChanged = form.has("role") && value("role") !== value("currentRole")
                const role = roleChanged ? pick("role", ["CUSTOMER", "ADMIN"]) : ""
                if (!statusChanged && !roleChanged) throw new Error("Nothing changed")
                if (statusChanged && !["ACTIVE", "SUSPENDED"].includes(status)) throw new Error("Choose a valid status")
                if (statusChanged) await consoleWrite(`/admin/users/${requiredId()}/status`, "PATCH", { status, reason: value("reason") })
                if (roleChanged) await consoleWrite(`/admin/users/${requiredId()}/role`, "PATCH", { role })
                break
            }
            case "invite": await consoleWrite("/admin/users", "POST", { firstName: needed("firstName", 80), lastName: needed("lastName", 80), email: needed("email", 254), role: "ADMIN" }); break
            case "dealer-update": {
                // One dialog edits status and plan; only what changed is sent.
                const status = pick("status", ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]), plan = pick("plan", ["BASIC", "SILVER", "GOLD"])
                const statusChanged = status !== value("currentStatus"), planChanged = plan !== value("currentPlan")
                if (!statusChanged && !planChanged) throw new Error("Nothing changed")
                if (statusChanged && status === "PENDING") throw new Error("Choose a valid status")
                if (statusChanged) await consoleWrite(`/admin/dealers/${requiredId()}/status`, "PATCH", { status, ...(status !== "APPROVED" ? { reason: needed("reason") } : {}) })
                if (planChanged) await consoleWrite(`/admin/dealers/${requiredId()}`, "PATCH", { plan })
                break
            }
            case "vehicle-update": {
                // One dialog edits the listing, its website highlights and its status; only what changed is sent,
                // and the status change goes last because an archived or rejected listing can no longer be edited.
                // Browsers send textarea line breaks as CRLF, so compare with normalised line endings.
                const changed = (field: string) => value(field).replace(/\r\n/g, "\n") !== value(`current-${field}`).replace(/\r\n/g, "\n")
                const flags = { isFeatured: form.get("isFeatured") === "on", isSpecial: form.get("isSpecial") === "on" }
                const flagsChanged = String(flags.isFeatured) !== value("current-isFeatured") || String(flags.isSpecial) !== value("current-isSpecial")
                const edits = form.has("price") ? ["price", "specialPrice", "colour", "stockNumber", "description"].filter(changed) : []
                const transition = value("transition")
                if (transition) pick("transition", ["approve", "reject", "publish", "suspend", "unsuspend", "relist", "archive"])
                if (!edits.length && !flagsChanged && !transition) throw new Error("Nothing changed")
                const reason = ["reject", "suspend", "archive"].includes(transition) ? needed("reason") : ""
                if (edits.length) {
                    const price = Number(value("price")); if (!Number.isInteger(price) || price < 1000) throw new Error("Enter a whole price of at least R1 000")
                    const special = value("specialPrice"), specialPrice = Number(special)
                    // The API keeps a special price once set; the special ends when "On special" is unticked.
                    if (!special && edits.includes("specialPrice")) throw new Error("A special price cannot be removed. To end the special, untick “On special”.")
                    if (special && (!Number.isInteger(specialPrice) || specialPrice < 1000 || specialPrice >= price)) throw new Error("The special price must be a whole amount below the price")
                    const colour = value("colour"), stockNumber = value("stockNumber"), description = value("description")
                    if (colour.length > 40 || stockNumber.length > 60 || description.length > 10000) throw new Error("Colour, stock number or description is too long")
                    // Only changed fields are sent, so clearing colour or stock number really clears it.
                    const all: Record<string, string | number> = { price, specialPrice, colour, stockNumber, description }
                    await consoleWrite(`/admin/vehicles/${requiredId()}`, "PATCH", Object.fromEntries(edits.map(field => [field, all[field]])))
                }
                if (flagsChanged) await consoleWrite(`/admin/vehicles/${requiredId()}/flags`, "PATCH", flags)
                if (transition) await consoleWrite(`/admin/vehicles/${requiredId()}/${transition}`, "POST", reason ? { reason } : {})
                break
            }
            case "retry-event": await consoleWrite(`/admin/system/outbox/events/${requiredId()}/retry`, "POST", {}); break
            case "refresh-snapshot": await consoleWrite("/admin/console/snapshots/refresh", "POST", {}); break
            case "model-update": await consoleWrite(`/admin/catalogue/models/${requiredId()}`, "PATCH", { name: needed("name", 80), isActive: form.get("isActive") === "on" }); break
            case "variant-create": case "variant-update": {
                const yearFrom = Number(value("yearFrom")), basePrice = Number(value("basePrice"));
                if (!Number.isInteger(yearFrom) || yearFrom < 1900 || yearFrom > new Date().getFullYear() + 2 || !Number.isInteger(basePrice) || basePrice < 0) throw new Error("Enter valid year and price")
                const modelId = value("modelId"); if (action === "variant-create" && !uuid.test(modelId)) throw new Error("Choose a model")
                await consoleWrite(action === "variant-create" ? "/admin/catalogue/variants" : `/admin/catalogue/variants/${requiredId()}`, action === "variant-create" ? "POST" : "PATCH", { name: needed("name", 120), yearFrom, basePrice, isActive: form.get("isActive") === "on", ...(action === "variant-create" ? { modelId } : {}) }); break
            }
            case "category-create": case "category-update": await consoleWrite(action === "category-create" ? "/admin/catalogue/categories" : `/admin/catalogue/categories/${requiredId()}`, action === "category-create" ? "POST" : "PATCH", { name: needed("name", 80), isActive: form.get("isActive") === "on" }); break
            case "make-create": await consoleWrite("/admin/catalogue/makes", "POST", { name: needed("name", 100) }); break
            case "make-update": await consoleWrite(`/admin/catalogue/makes/${requiredId()}`, "PATCH", { name: needed("name", 100), isActive: form.get("isActive") === "on" }); break
            case "model-create": { const makeId = value("makeId"); if (!uuid.test(makeId)) throw new Error("Choose a make"); await consoleWrite("/admin/catalogue/models", "POST", { makeId, name: needed("name", 100) }); break }
            case "faq-create": case "faq-update": await write(action === "faq-create", "faqs", { question: needed("question", 300), answer: needed("answer", 5000), category: text("category", 60), sortOrder: order(), isActive: active() }); break
            case "faq-delete": await consoleWrite(`/admin/faqs/${requiredId()}`, "DELETE"); break
            case "article-create": await consoleWrite("/admin/articles", "POST", { title: needed("title", 200), body: [{ type: "paragraph", text: needed("body", 20000) }] }); break
            case "page-create": await consoleWrite("/admin/pages", "POST", { title: needed("title", 200), slug: needed("slug", 120), body: [{ type: "paragraph", text: needed("body", 20000) }] }); break
            case "article-status": case "page-status": await consoleWrite(`/admin/${action === "article-status" ? "articles" : "pages"}/${requiredId()}/status`, "POST", { status: pick("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]) }); break
            case "special-create": case "special-update": {
                const { startsAt, endsAt } = dates()
                const create = action === "special-create"
                // A new special starts straight away unless a start is chosen; an existing one keeps its start when left empty.
                await write(create, "promotions", { title: needed("title", 200), description: text("description", 2000), bannerUrl: link("bannerUrl", "banner image", true), isActive: active(),
                    ...(startsAt ? { startsAt } : create ? { startsAt: new Date().toISOString() } : {}), endsAt }); break
            }
            case "ad-create": case "ad-update": await write(action === "ad-create", "ad-banners", {
                title: needed("title", 120), placement: pick("placement", ["HOME_HERO", "HOME_DEALERS", "HOME_BOTTOM"]), imageUrl: link("imageUrl", "banner image", true),
                linkUrl: link("linkUrl", "link"), altText: text("altText", 200), sortOrder: order(), isActive: active(), ...dates(),
            }); break
            case "testimonial-create": case "testimonial-update": await write(action === "testimonial-create", "testimonials", {
                name: needed("name", 120), text: needed("text", 10000).replace(/\r\n/g, "\n"), photoUrl: link("photoUrl", "photo"), rating: Number(pick("rating", ["1", "2", "3", "4", "5"])), sortOrder: order(), isActive: active(),
            }); break
            case "featured-create": case "featured-update": {
                const slug = value("slug"), dealerId = value("dealerId")
                if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("The page address may use lowercase letters, numbers and dashes")
                if (dealerId && !uuid.test(dealerId) && !/^\d+$/.test(dealerId)) throw new Error("Enter the dealer ID from the Dealers page")
                await write(action === "featured-create", "featured-dealers", {
                    name: needed("name", 160), ...(slug ? { slug } : {}), logoUrl: link("logoUrl", "logo"), description: text("description", 500), about: text("about", 20000),
                    dealerId: dealerId || null, sortOrder: order(), isActive: active(),
                }); break
            }
            case "media-create": case "media-update": {
                const url = value("url"); if (!/^https:\/\/\S+$/i.test(url) || url.length > 2000) throw new Error("Enter the video or podcast link (https://…)")
                const create = action === "media-create"
                const item = await write(create, "media", { type: pick("type", ["VIDEO", "PODCAST"]), title: needed("title", 200), description: text("description", 2000), url, thumbnailUrl: link("thumbnailUrl", "thumbnail") }) as { id?: string } | undefined
                const status = form.get("published") === "on" ? "PUBLISHED" : "DRAFT"
                if (create ? status === "PUBLISHED" : status !== value("currentStatus")) await consoleWrite(`/admin/media/${create ? item?.id : requiredId()}/status`, "POST", { status })
                break
            }
            case "special-delete": case "ad-delete": case "testimonial-delete": case "featured-delete": case "media-delete":
                await consoleWrite(`/admin/${({ "special-delete": "promotions", "ad-delete": "ad-banners", "testimonial-delete": "testimonials", "featured-delete": "featured-dealers", "media-delete": "media" } as Record<string, string>)[action]}/${requiredId()}`, "DELETE"); break
        }
    } catch (error) {
        // A combined save (dealer-update, vehicle-update) can fail part-way: refresh so the page shows what was saved.
        if (error instanceof BackendError) { revalidatePath("/dashboard", "layout"); return { error: error.message } }
        if (error instanceof Error && !("digest" in error)) { revalidatePath("/dashboard", "layout"); return { error: error.message } }
        throw error
    }
    revalidatePath("/dashboard", "layout")
    return { success: "Saved. The latest data is shown below." }
}

export async function openDealer(form: FormData) {
    await requireSuperAdmin()
    const id = String(form.get("id") ?? "")
    if (!uuid.test(id) && !/^\d+$/.test(id)) throw new Error("Invalid dealer")
    redirect(`/dashboard/super-admin/dealers/${id}`)
}
