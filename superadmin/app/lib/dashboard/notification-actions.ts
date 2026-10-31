"use server"

import { unstable_rethrow } from "next/navigation"
import { BackendError } from "../backend/client"
import { consoleWrite, requireSuperAdmin } from "./console"

export type NotificationState = { error?: string; success?: string }

export async function sendNotification(_previous: NotificationState, form: FormData): Promise<NotificationState> {
    await requireSuperAdmin()
    const appId = String(form.get("appId") ?? "changecars")
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(appId)) return { error: "Choose a valid app." }
    const title = String(form.get("title") ?? "").trim()
    const body = String(form.get("body") ?? "").trim()
    const audience = String(form.get("audience") ?? "")
    if (!title || title.length > 120 || !body || body.length > 1000) return { error: "Enter a title (up to 120 characters) and message (up to 1,000 characters)." }
    if (!["all", "customers", "dealers", "selected"].includes(audience)) return { error: "Choose an audience." }
    const userIds = [...new Set(String(form.get("userIds") ?? "").split(/[\s,]+/).filter(Boolean))]
    if (audience === "selected" && (!userIds.length || userIds.length > 500 || userIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))) return { error: "Enter between 1 and 500 valid user IDs." }
    try {
        const result = await consoleWrite("/admin/notifications/broadcast", "POST", { appId, title, body, audience, ...(audience === "selected" ? { userIds } : {}) })
        return { success: `Notification queued for ${result.recipients} active users. Delivery respects notification preferences.${result.pushConfigured ? "" : " Phone push needs Firebase configuration; in-app and live delivery are available."}` }
    } catch (error) {
        unstable_rethrow(error)
        return { error: error instanceof BackendError ? error.message : "Could not confirm the send request. Check the audit trail before trying again." }
    }
}
