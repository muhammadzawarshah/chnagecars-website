"use server"

import { cookies } from "next/headers"
import { ACCESS_COOKIE, BackendError, REFRESH_COOKIE, backendEnabled, backendPost } from "./client"

// Server Actions the website's forms call on submit. Each one returns a plain result the
// form can show with its existing error messages. Without API_URL they succeed without
// sending anything, which is how the forms behaved before the API was connected.

export type FormResult =
    | { ok: true, reference?: string, redirectTo?: string, uploadToken?: string }
    | { ok: false, message: string, fields: Record<string, string> }

export type UploadSlot =
    | { ok: true, uploadUrl: string, storageKey: string, contentType: string }
    | { ok: false, message: string }

type FormValue = string | number | boolean | undefined
type Tokens = {
    accessToken: string
    expiresIn: number
    refreshToken: string
    refreshTokenExpiresAt: string
    user: { role: "CUSTOMER" | "DEALER" | "ADMIN" | "SUPER_ADMIN" }
}

const FORMS = ["newsletter", "contact", "vehicle-enquiry", "beat-my-quote", "keep-it", "new-vehicle-quote", "value-my-vehicle", "sell-vehicle", "sell-vehicle-site", "special"];

const homeFor: Record<Tokens["user"]["role"], string> = {
    SUPER_ADMIN: "/dashboard/super-admin",
    ADMIN: "/dashboard/admin",
    DEALER: "/dashboard/dealer",
    CUSTOMER: "/",
};

// Field problems and clear refusals keep the API's wording (it is written for visitors);
// outages and server faults already carry friendly text from the client.
function failure(error: unknown): { ok: false, message: string, fields: Record<string, string> } {
    if (error instanceof BackendError) {
        if (error.status === 429) return { ok: false, message: "Too many attempts. Please wait a minute and try again.", fields: {} };
        return { ok: false, message: error.message, fields: error.status < 500 ? error.fields : {} };
    }
    console.error("Form submit failed", error);
    return { ok: false, message: "We could not send this right now. Please try again in a moment.", fields: {} };
}

function clean(values: Record<string, FormValue>) {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

// Every enquiry, quote, sell and newsletter form.
export async function submitWebsiteForm(form: string, values: Record<string, FormValue>): Promise<FormResult> {
    if (!FORMS.includes(form)) return { ok: false, message: "Unknown form", fields: {} };
    if (!backendEnabled()) return { ok: true };
    try {
        const result = await backendPost<{ reference?: string, uploadToken?: string }>(`/web/forms/${form}`, clean(values));
        return { ok: true, reference: result?.reference, uploadToken: result?.uploadToken };
    } catch (error) {
        return failure(error);
    }
}

// Login page and login popup. Keeps the session in http-only cookies; proxy.ts refreshes it.
export async function signIn(email: string, password: string): Promise<FormResult> {
    if (!backendEnabled()) return { ok: true };
    let tokens: Tokens;
    try {
        tokens = await backendPost<Tokens>("/auth/login", { email: String(email).trim(), password: String(password) });
    } catch (error) {
        if (error instanceof BackendError && (error.status === 401 || error.status === 400)) {
            return { ok: false, message: "Email or password is incorrect", fields: { password: "Email or password is incorrect" } };
        }
        if (error instanceof BackendError && error.status === 403) {
            return { ok: false, message: "This account is not active", fields: { email: "This account is not active" } };
        }
        return failure(error);
    }
    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set(ACCESS_COOKIE, tokens.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: tokens.expiresIn });
    store.set(REFRESH_COOKIE, tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: new Date(tokens.refreshTokenExpiresAt) });
    return { ok: true, redirectTo: homeFor[tokens.user.role] ?? "/" };
}

// Register page and register popup (private seller or dealer).
export async function registerAccount(values: Record<string, FormValue>): Promise<FormResult> {
    if (!backendEnabled()) return { ok: true };
    try {
        await backendPost("/web/auth/register", clean(values));
        return { ok: true };
    } catch (error) {
        return failure(error);
    }
}

// Forgot password popup. The API always answers the same way, so no one can probe for accounts.
export async function requestPasswordReset(email: string): Promise<FormResult> {
    if (!backendEnabled()) return { ok: true };
    try {
        await backendPost("/auth/forgot-password", { email: String(email).trim() });
        return { ok: true };
    } catch (error) {
        return failure(error);
    }
}

// Photos and documents of a submitted form: first a presigned URL the browser uploads the file to…
export async function prepareUpload(token: string, kind: "photo" | "document", contentType: string): Promise<UploadSlot> {
    if (!backendEnabled()) return { ok: false, message: "Uploads are not connected" };
    try {
        const slot = await backendPost<{ uploadUrl: string, storageKey: string, contentType: string }>("/web/uploads/url", { token, kind, contentType });
        return { ok: true, ...slot };
    } catch (error) {
        return { ok: false, message: failure(error).message };
    }
}

// …then, once uploaded, attaching it to the request.
export async function finishUpload(token: string, kind: "photo" | "document", storageKey: string, contentType: string, fileName: string): Promise<FormResult> {
    if (!backendEnabled()) return { ok: true };
    try {
        await backendPost("/web/uploads/confirm", { token, kind, storageKey, contentType, fileName });
        return { ok: true };
    } catch (error) {
        return failure(error);
    }
}
