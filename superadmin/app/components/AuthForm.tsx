"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, forgotPassword, resetPassword, type AuthState } from "../lib/auth/actions";
import Header from "./Site/Header";
import Footer from "./Site/Footer";
import LanguageProvider from "./Site/LanguageContext";
export default function AuthForm({ mode = "login", token = "", notice }: { mode?: "login" | "forgot" | "reset"; token?: string; notice?: string }) {
  const action = mode === "forgot" ? forgotPassword : mode === "reset" ? resetPassword : login;
  const [state, submit, pending] = useActionState<AuthState, FormData>(action, {});
  const title = mode === "login" ? "Superadmin login" : mode === "forgot" ? "Forgot password" : "Reset password";
  return <LanguageProvider><div className="flex min-h-screen flex-col text-ink max-[981px]:mt-14">
    <Header />
    <main className="flex flex-1 items-center justify-center bg-[#f6f5f2] px-5 py-12">
    <section className="w-full max-w-md rounded-2xl border border-[#ebe8e1] bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-center text-2xl font-bold">{title}</h1>
      {notice && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{notice}</p>}
      <form action={submit} className="grid gap-5">
        {mode !== "reset" && <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" autoComplete="username" required maxLength={254} className="rounded-lg border border-[#d9d9d9] p-3 font-normal" /></label>}
        {mode !== "forgot" && <label className="grid gap-2 text-sm font-bold">Password<input name="password" type="password" autoComplete={mode === "reset" ? "new-password" : "current-password"} required minLength={mode === "reset" ? 8 : 1} maxLength={128} className="rounded-lg border border-[#d9d9d9] p-3 font-normal" /></label>}
        {mode === "reset" && <><input type="hidden" name="token" value={token} /><p className="text-sm text-[#6b6862]">Use 8–128 characters, including a letter and a number.</p></>}
        {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-green-800">{state.message}</p>}
        <button disabled={pending || (mode === "reset" && !token)} className="cursor-pointer rounded-lg bg-gold px-5 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60">{pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "forgot" ? "Send reset link" : "Update password"}</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href={mode === "login" ? "/forgot-password" : "/login"} className="text-gold underline">{mode === "login" ? "Forgot password?" : "Back to login"}</Link></p>
    </section>
    </main>
    <Footer />
  </div></LanguageProvider>;
}
