import { cookies, headers } from "next/headers"
import { redirect, unstable_rethrow } from "next/navigation"

// Server-side calls from the website to the ChangeCars API (backend/src/modules/web).
// Set API_URL (e.g. http://localhost:4000/api/v1) in .env.local to use the API; without it
// the site keeps using its sample data, exactly as before. Only server code imports this file.

export const ACCESS_COOKIE = "cc_access"
export const REFRESH_COOKIE = "cc_refresh"

export function backendEnabled() {
    return !!process.env.API_URL
}

export function apiUrl(path: string) {
    return `${process.env.API_URL!.replace(/\/+$/, "")}${path}`
}

// One error type for every failed call. `fields` holds per-input messages (422 FORM_INVALID).
export class BackendError extends Error {
    constructor(readonly status: number, readonly code: string, message: string, readonly fields: Record<string, string> = {}, readonly requestId?: string) {
        super(message)
    }
}

const UNAVAILABLE = "We could not reach our servers. Please check your connection and try again."
const TIMEOUT = "Our servers are taking too long to respond. Please try again in a moment."
const GET_TIMEOUT_MS = 10_000
const POST_TIMEOUT_MS = 20_000

async function toError(response: Response, path: string) {
    let body: { code?: string, message?: string | string[], details?: { fields?: Record<string, string> }, requestId?: string } = {}
    try {
        body = await response.json()
    } catch {
        // not JSON: keep the status only
    }
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message
    // Server faults are logged with the API request id so they can be traced in the API logs.
    if (response.status >= 500) console.error(`[api] ${path} → ${response.status} ${body.code ?? ""} requestId=${body.requestId ?? "?"}`)
    const safeMessage = response.status >= 500 ? "Something went wrong on our side. Please try again in a moment." : message
    return new BackendError(response.status, body.code ?? "HTTP_ERROR", safeMessage ?? `Request failed (${response.status})`, body.details?.fields ?? {}, body.requestId)
}

// One place for timeouts and network failures. GETs use a timer instead of an abort signal so Next
// can still share one request between generateMetadata and the page.
async function send(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const abortable = init.method === "POST"
    try {
        const request = fetch(apiUrl(path), abortable ? { ...init, signal: AbortSignal.timeout(timeoutMs) } : init)
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new BackendError(504, "API_TIMEOUT", TIMEOUT)), timeoutMs)
        })
        return await Promise.race([request, timeout])
    } catch (error) {
        // Next.js signals (dynamic rendering, redirects) pass straight through.
        unstable_rethrow(error)
        if (error instanceof BackendError) {
            console.error(`[api] ${path} timed out after ${timeoutMs} ms`)
            throw error
        }
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
            console.error(`[api] ${path} timed out after ${timeoutMs} ms`)
            throw new BackendError(504, "API_TIMEOUT", TIMEOUT)
        }
        console.error(`[api] ${path} unreachable:`, error instanceof Error ? error.message : error)
        throw new BackendError(503, "API_UNAVAILABLE", UNAVAILABLE)
    } finally {
        clearTimeout(timer)
    }
}

// The visitor's IP, forwarded with the shared key so the API rate-limits per visitor, not per web server.
async function visitorHeaders(): Promise<Record<string, string>> {
    const key = process.env.WEB_ADAPTER_KEY
    if (!key) return {}
    try {
        const list = await headers()
        const ip = (list.get("x-forwarded-for")?.split(",")[0] ?? list.get("x-real-ip") ?? "").trim()
        return ip ? { "x-web-adapter-key": key, "x-web-client-ip": ip.replace(/^::ffff:/, "") } : {}
    } catch {
        return {}
    }
}

// Public data (cars, articles). Cached by Next for `revalidate` seconds; `fresh` skips the cache.
// Returns undefined for 404 so pages can call notFound().
export async function publicGet<T>(path: string, options: { revalidate?: number, fresh?: boolean } = {}): Promise<T | undefined> {
    const response = await send(path, options.fresh ? { cache: "no-store" } : { next: { revalidate: options.revalidate ?? 60 } }, GET_TIMEOUT_MS)
    if (response.status === 404) return undefined
    if (!response.ok) throw await toError(response, path)
    return response.json() as Promise<T>
}

async function accessToken() {
    return (await cookies()).get(ACCESS_COOKIE)?.value
}

// Signed-in data (dashboards). Never cached. A missing or expired session goes to the login page;
// 403/404 return undefined so screens show their "not found" state.
export async function authGet<T>(path: string): Promise<T | undefined> {
    const token = await accessToken()
    if (!token) redirect("/login")
    const response = await send(path, { cache: "no-store", headers: { authorization: `Bearer ${token}`, ...(await visitorHeaders()) } }, GET_TIMEOUT_MS)
    if (response.status === 401) redirect("/login")
    if (response.status === 403 || response.status === 404) return undefined
    if (!response.ok) throw await toError(response, path)
    return response.json() as Promise<T>
}

// Writes from Server Actions (forms, sign-in, dashboard buttons).
export async function backendPost<T>(path: string, body: unknown, options: { auth?: boolean } = {}): Promise<T> {
    const token = options.auth ? await accessToken() : undefined
    if (options.auth && !token) throw new BackendError(401, "UNAUTHORIZED", "Please sign in again")
    const response = await send(path, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(await visitorHeaders()) },
        body: JSON.stringify(body ?? {}),
    }, POST_TIMEOUT_MS)
    if (!response.ok) throw await toError(response, path)
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
}

// Query string from a plain object, skipping empty values.
export function queryString(values: Record<string, string | number | undefined>) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== "") query.set(key, String(value))
    }
    const text = query.toString()
    return text ? `?${text}` : ""
}

// Extras on a page (similar cars, latest news…): if they cannot load, the page shows without them
// instead of failing as a whole. The main content of a page is loaded without this, so a real
// outage still shows the error page with "Try again".
export async function softly<T>(what: string, load: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await load()
    } catch (error) {
        unstable_rethrow(error)
        console.error(`[api] ${what} unavailable; showing the page without it`, error instanceof BackendError ? error.code : error)
        return fallback
    }
}
