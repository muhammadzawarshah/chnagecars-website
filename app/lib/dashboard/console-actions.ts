"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { BackendError } from "../backend/client"
import { consoleWrite, requireSuperAdmin } from "./console"

export type ActionState = { error?: string, success?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const allowedActions = ["dealer-status", "dealer-plan", "user-status", "user-role", "invite", "vehicle-transition", "vehicle-flags", "vehicle-edit", "retry-event", "refresh-snapshot", "make-create", "make-update", "model-create", "faq-create", "faq-update", "article-create", "article-status", "page-create", "page-status", "promotion-create", "lead-assign", "lead-stage", "model-update", "variant-create", "variant-update", "category-create", "category-update", "promotion-update"]

export async function manageConsole(_previous: ActionState, form: FormData): Promise<ActionState> {
    await requireSuperAdmin()
    const value = (key: string) => String(form.get(key) ?? "").trim()
    const action = value("action"), id = value("id")
    if (!allowedActions.includes(action)) return { error: "Unknown action" }
    if (id && !uuid.test(id)) return { error: "Invalid record ID" }
    const pick = (field: string, options: string[]) => { const v = value(field); if (!options.includes(v)) throw new Error(`Choose a valid ${field}`); return v }
    const needed = (field: string, max = 1000) => { const v = value(field); if (!v || v.length > max) throw new Error(`Enter a valid ${field}`); return v }
    const requiredId = () => { if (!uuid.test(id)) throw new Error("Record ID is required"); return id }
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
            case "dealer-status": {
                const status = pick("status", ["APPROVED", "REJECTED", "SUSPENDED"])
                await consoleWrite(`/admin/dealers/${requiredId()}/status`, "PATCH", { status, ...(status !== "APPROVED" ? { reason: needed("reason") } : {}) }); break
            }
            case "dealer-plan": await consoleWrite(`/admin/dealers/${requiredId()}`, "PATCH", { plan: pick("plan", ["BASIC", "SILVER", "GOLD"]) }); break
            case "user-status": await consoleWrite(`/admin/users/${requiredId()}/status`, "PATCH", { status: pick("status", ["ACTIVE", "SUSPENDED"]), reason: value("reason") }); break
            case "user-role": await consoleWrite(`/admin/users/${requiredId()}/role`, "PATCH", { role: pick("role", ["CUSTOMER", "ADMIN"]) }); break
            case "invite": await consoleWrite("/admin/users", "POST", { firstName: needed("firstName", 80), lastName: needed("lastName", 80), email: needed("email", 254), role: "ADMIN" }); break
            case "vehicle-transition": {
                const transition = pick("transition", ["approve", "reject", "publish", "suspend", "unsuspend", "relist", "archive"])
                const reason = ["reject", "suspend", "archive"].includes(transition) ? needed("reason") : value("reason")
                await consoleWrite(`/admin/vehicles/${requiredId()}/${transition}`, "POST", reason ? { reason } : {}); break
            }
            case "vehicle-flags": await consoleWrite(`/admin/vehicles/${requiredId()}/flags`, "PATCH", { isFeatured: form.get("isFeatured") === "on", isSpecial: form.get("isSpecial") === "on" }); break
            case "vehicle-edit": {
                const price = Number(value("price")); if (!Number.isInteger(price) || price < 1000) throw new Error("Enter a whole price of at least R1 000")
                const special = value("specialPrice"), specialPrice = Number(special)
                if (special && (!Number.isInteger(specialPrice) || specialPrice < 1000 || specialPrice >= price)) throw new Error("The special price must be a whole amount below the price")
                const colour = value("colour"), stockNumber = value("stockNumber"), description = value("description")
                if (colour.length > 40 || stockNumber.length > 60 || description.length > 10000) throw new Error("Colour, stock number or description is too long")
                await consoleWrite(`/admin/vehicles/${requiredId()}`, "PATCH", { price, ...(special ? { specialPrice } : {}), ...(colour ? { colour } : {}), ...(stockNumber ? { stockNumber } : {}), description }); break
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
            case "promotion-update": await consoleWrite(`/admin/promotions/${requiredId()}`, "PATCH", { title: needed("title", 200), isActive: form.get("isActive") === "on" }); break
            case "make-create": await consoleWrite("/admin/catalogue/makes", "POST", { name: needed("name", 100) }); break
            case "make-update": await consoleWrite(`/admin/catalogue/makes/${requiredId()}`, "PATCH", { name: needed("name", 100), isActive: form.get("isActive") === "on" }); break
            case "model-create": { const makeId = value("makeId"); if (!uuid.test(makeId)) throw new Error("Choose a make"); await consoleWrite("/admin/catalogue/models", "POST", { makeId, name: needed("name", 100) }); break }
            case "faq-create": case "faq-update": await consoleWrite(action === "faq-create" ? "/admin/faqs" : `/admin/faqs/${requiredId()}`, action === "faq-create" ? "POST" : "PATCH", { question: needed("question", 300), answer: needed("answer", 5000), isActive: form.get("isActive") === "on" }); break
            case "article-create": await consoleWrite("/admin/articles", "POST", { title: needed("title", 200), body: [{ type: "paragraph", text: needed("body", 20000) }] }); break
            case "page-create": await consoleWrite("/admin/pages", "POST", { title: needed("title", 200), slug: needed("slug", 120), body: [{ type: "paragraph", text: needed("body", 20000) }] }); break
            case "article-status": case "page-status": await consoleWrite(`/admin/${action === "article-status" ? "articles" : "pages"}/${requiredId()}/status`, "POST", { status: pick("status", ["DRAFT", "PUBLISHED", "ARCHIVED"]) }); break
            case "promotion-create": {
                const starts = new Date(needed("startsAt") + "Z"), ends = new Date(needed("endsAt") + "Z")
                if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends <= starts) throw new Error("Choose an end time after the start time")
                await consoleWrite("/admin/promotions", "POST", { title: needed("title", 200), startsAt: starts.toISOString(), endsAt: ends.toISOString() }); break
            }
        }
    } catch (error) {
        if (error instanceof BackendError) return { error: error.message }
        if (error instanceof Error && !("digest" in error)) return { error: error.message }
        throw error
    }
    revalidatePath("/dashboard", "layout")
    return { success: "Saved. The latest data is shown below." }
}

export async function openDealer(form: FormData) {
    await requireSuperAdmin()
    const id = String(form.get("id") ?? "")
    if (!uuid.test(id)) throw new Error("Invalid dealer")
    redirect(`/dashboard/super-admin/dealers/${id}`)
}
