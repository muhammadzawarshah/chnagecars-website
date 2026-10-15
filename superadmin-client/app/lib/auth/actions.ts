"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, backendPost, BackendError, backendEnabled } from "../backend/client";
export type AuthState = { error?: string; message?: string };
type Tokens = { accessToken: string; expiresIn: number; refreshToken: string; refreshTokenExpiresAt: string; user: { role: string } };
function failure(error: unknown): AuthState {
  return { error: error instanceof BackendError ? error.message : "The server could not be reached. Please try again." };
}
export async function login(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!backendEnabled()) return { error: "Set API_URL to your backend /api/v1 URL before signing in." };
  let tokens: Tokens;
  try {
    tokens = await backendPost<Tokens>("/auth/login", { email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") });
    if (tokens.user.role !== "SUPER_ADMIN") {
      await fetch(`${process.env.API_URL!.replace(/\/+$/, "")}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${tokens.accessToken}` }, signal: AbortSignal.timeout(10_000) }).catch(() => undefined);
      return { error: "Only a superadmin account can sign in to this app." };
    }
  } catch (error) { return failure(error); }
  const store = await cookies();
  const secure = process.env.SESSION_COOKIE_SECURE === "false" ? false : process.env.NODE_ENV === "production";
  store.set(ACCESS_COOKIE, tokens.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: tokens.expiresIn });
  store.set(REFRESH_COOKIE, tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", expires: new Date(tokens.refreshTokenExpiresAt) });
  redirect("/dashboard/super-admin");
}
export async function logout() {
  try { await backendPost("/auth/logout", {}, { auth: true }); } catch { /* Clear browser credentials even if the API session expired. */ }
  const store = await cookies(); store.delete(ACCESS_COOKIE); store.delete(REFRESH_COOKIE);
  redirect("/login");
}
export async function forgotPassword(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!backendEnabled()) return { error: "Configure API_URL before requesting a password reset." };
  try {
    await backendPost("/auth/forgot-password", { email: String(form.get("email") ?? "").trim() });
    return { message: "If the account exists, a password reset link has been sent." };
  } catch (error) { return failure(error); }
}
export async function resetPassword(_state: AuthState, form: FormData): Promise<AuthState> {
  if (!backendEnabled()) return { error: "Configure API_URL before resetting a password." };
  try {
    await backendPost("/auth/reset-password", { token: String(form.get("token") ?? ""), password: String(form.get("password") ?? "") });
    return { message: "Password updated. You can now sign in." };
  } catch (error) { return failure(error); }
}
