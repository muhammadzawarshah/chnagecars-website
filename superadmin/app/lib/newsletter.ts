"use server"

import { BackendError, backendEnabled, backendPost } from "./backend/client"

// The footer newsletter form, sent to the same API form as the website footer.
export async function subscribeNewsletter(values: { name?: string, surname?: string, email?: string }): Promise<{ ok: true } | { ok: false, message: string }> {
    if (!backendEnabled()) return { ok: false, message: "We could not send this right now. Please try again in a moment." }
    try {
        await backendPost("/web/forms/newsletter", { ...values, source: "web:footer" })
        return { ok: true }
    } catch (error) {
        if (error instanceof BackendError) {
            if (error.status === 429) return { ok: false, message: "Too many attempts. Please wait a minute and try again." }
            if (error.status < 500) return { ok: false, message: Object.values(error.fields)[0] ?? error.message }
        }
        console.error("Newsletter sign-up failed", error)
        return { ok: false, message: "We could not send this right now. Please try again in a moment." }
    }
}
