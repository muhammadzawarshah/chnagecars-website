"use server"

import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { BackendError } from "../backend/client"
import { consoleWrite, requireSuperAdmin } from "./console"

export type CustomerAppState = { error?: string; success?: string }
export async function manageCustomerApp(_previous: CustomerAppState, form: FormData): Promise<CustomerAppState> {
    await requireSuperAdmin()
    const value = (key: string) => String(form.get(key) ?? "").trim()
    const id = value("id")
    if (id !== "group1") return { error: "Only the Group1 app is enabled." }
    try {
        if (value("action") === "status") {
            const enabled = value("enabled")
            if (!["true", "false"].includes(enabled)) return { error: "Choose a valid status." }
            await consoleWrite(`/admin/customer-apps/${id}/status`, "PATCH", { enabled: enabled === "true" })
        } else if (value("action") === "create") {
            const name = value("name"), resetUrl = value("resetUrl")
            const dealerIds = [...new Set(value("dealerIds").split(/[\s,]+/).filter(Boolean))]
            if (!name || name.length > 120 || !resetUrl || resetUrl.length > 2000 || !dealerIds.length || dealerIds.length > 20 || dealerIds.some(id => !/^\d{1,10}$/.test(id))) return { error: "Enter an app name, reset URL and between 1 and 20 numeric dealer IDs." }
            await consoleWrite("/admin/customer-apps", "POST", { id, name, dealerIds, resetUrl })
        } else return { error: "Unknown action." }
        revalidatePath("/dashboard/super-admin/customer-apps")
        revalidatePath("/dashboard/super-admin/notifications")
        return { success: value("action") === "create" ? "Group1 settings saved. Registration uses its separate customer accounts." : "App status updated." }
    } catch (error) {
        unstable_rethrow(error)
        return { error: error instanceof BackendError ? error.message : "Could not confirm the update. Refresh the list before retrying." }
    }
}
