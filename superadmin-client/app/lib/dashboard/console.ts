import "server-only"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { ACCESS_COOKIE, apiUrl, authGet, backendEnabled, BackendError, queryString } from "../backend/client"
import { getDashboardUser } from "./session"

export type Row = Record<string, unknown>
export type PageData = { data: Row[], meta: { page: number, pageSize: number, total: number, pageCount: number } }
export type ConsoleQuery = Record<string, string | string[] | undefined>

export async function requireSuperAdmin() {
    if (!backendEnabled()) throw new Error("Configure API_URL to connect the super admin console to real data.")
    return getDashboardUser("super-admin")
}

export async function consoleGet<T>(path: string): Promise<T> {
    await requireSuperAdmin()
    const data = await authGet<T>(path)
    if (data === undefined) notFound()
    return data
}

export async function consoleWrite(path: string, method: "POST" | "PATCH" | "PUT" | "DELETE", body?: unknown) {
    await requireSuperAdmin()
    const token = (await cookies()).get(ACCESS_COOKIE)?.value
    if (!token) redirect("/login")
    const response = await fetch(apiUrl(path), { method, cache: "no-store", signal: AbortSignal.timeout(30_000),
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new BackendError(response.status, data.code ?? "HTTP_ERROR", response.status >= 500 ? "The update could not be completed. Please try again." : Array.isArray(data.message) ? data.message.join(", ") : data.message ?? "Update refused")
    }
    return (response.status === 204 ? {} : response.json()) as Promise<Row>
}

export function text(value: unknown): string {
    return typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : ""
}
export function record(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {} }
export function list(value: unknown): Row[] { return Array.isArray(value) ? value.map(record) : [] }
export function queryValue(query: ConsoleQuery, key: string) { return text(query[key]) }
export function paginationQuery(query: ConsoleQuery, extras: Record<string, string> = {}) {
    const raw = Number(queryValue(query, "page"))
    const page = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 10000) : 1
    const q = queryValue(query, "q").trim().slice(0, 100)
    return queryString({ page, pageSize: 20, q, ...extras })
}
