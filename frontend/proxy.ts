import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Keeps the dashboard login alive: when the short-lived access token is missing or about to
// expire, swap the refresh token for new ones before the page renders (Server Components
// cannot set cookies themselves). Only runs when the site is connected to the API.

const ACCESS_COOKIE = "cc_access"
const REFRESH_COOKIE = "cc_refresh"
const EARLY_REFRESH_MS = 60_000

function expiresSoon(token: string | undefined) {
    if (!token) return true
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number }
        return !payload.exp || payload.exp * 1000 - Date.now() < EARLY_REFRESH_MS
    } catch {
        return true
    }
}

export async function proxy(request: NextRequest) {
    const api = process.env.API_URL
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
    if (!api || !refreshToken || !expiresSoon(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next()

    let tokens: { accessToken: string, expiresIn: number, refreshToken: string, refreshTokenExpiresAt: string } | undefined
    try {
        const response = await fetch(`${api.replace(/\/+$/, "")}/auth/refresh`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        })
        if (response.ok) tokens = await response.json()
        else if (response.status !== 401 && response.status !== 400) return NextResponse.next()
    } catch {
        return NextResponse.next()
    }

    if (!tokens) {
        // Refresh token expired or revoked: clear the session so the page sends the user to login.
        const headers = new Headers(request.headers)
        headers.set("cookie", request.cookies.getAll().filter((cookie) => cookie.name !== ACCESS_COOKIE && cookie.name !== REFRESH_COOKIE).map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`).join("; "))
        const response = NextResponse.next({ request: { headers } })
        response.cookies.delete(ACCESS_COOKIE)
        response.cookies.delete(REFRESH_COOKIE)
        return response
    }

    // The page rendering now must see the new token, and the browser must keep it.
    const forwarded = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]))
    forwarded.set(ACCESS_COOKIE, tokens.accessToken)
    forwarded.set(REFRESH_COOKIE, tokens.refreshToken)
    const headers = new Headers(request.headers)
    headers.set("cookie", [...forwarded].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "))

    const response = NextResponse.next({ request: { headers } })
    const secure = process.env.NODE_ENV === "production"
    response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: tokens.expiresIn })
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: new Date(tokens.refreshTokenExpiresAt) })
    return response
}

export const config = {
    matcher: ["/dashboard/:path*"],
}
