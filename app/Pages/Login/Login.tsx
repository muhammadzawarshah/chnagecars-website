"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { usePopup } from "../../components/Popups/PopupContext"
import LoginField from "./Section/LoginField"

export default function Login() {

    const { open } = usePopup();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setErrors({
            email: !email.trim() ? "Email is required" : !/^\S+@\S+\.\S+$/.test(email) ? "Please enter a valid email address" : "",
            password: !password ? "Password is required" : "",
        });
    }

    return (
        <>
            <main className="bg-[#f8fafd] px-5 pt-5 pb-20 min-[982px]:max-[1111px]:pt-20">
                <div className="mx-auto w-full max-w-150">
                    <Link href="/" aria-label="Back" className="flex size-6.5 items-center justify-center min-[982px]:hidden">
                        <svg width="20" height="17" viewBox="0 0 20 17" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 8.5H2M8.5 2L2 8.5 8.5 15" />
                        </svg>
                    </Link>
                    <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="mx-auto mt-9.5 block h-auto w-80 max-w-full" />
                    <h1 className="mt-13 mb-0 text-center text-2xl leading-[1.2] font-bold text-[#957e4e]">Login</h1>
                    <p className="mt-4 mb-0 text-center font-roboto text-sm text-[#949494]">Please Confirm Your Email and Enter Your Password</p>
                    <form onSubmit={handleSubmit} noValidate className="mt-12">
                        <div className="flex flex-col gap-8.5">
                            <LoginField
                                type="email"
                                placeholder="Enter Your Email Address"
                                value={email}
                                error={errors.email}
                                onChange={setEmail}
                                icon={
                                    <svg width="20" height="15" viewBox="0 0 20 15" fill="none" stroke="#8c8c8c" strokeWidth="1.3">
                                        <rect x="0.75" y="0.75" width="18.5" height="13.5" rx="1" />
                                        <path d="M1 1.5l9 7 9-7" />
                                    </svg>
                                }
                            />
                            <LoginField
                                type="password"
                                placeholder="Enter Your Password"
                                value={password}
                                error={errors.password}
                                onChange={setPassword}
                                icon={
                                    <svg width="16" height="21" viewBox="0 0 16 21" fill="none" stroke="#8c8c8c" strokeWidth="1.3">
                                        <rect x="0.75" y="8.75" width="14.5" height="11.5" rx="2" />
                                        <path d="M3.5 8.5V5.5a4.5 4.5 0 0 1 9 0v3" />
                                        <circle cx="5" cy="14.5" r="0.6" fill="#8c8c8c" />
                                        <circle cx="8" cy="14.5" r="0.6" fill="#8c8c8c" />
                                        <circle cx="11" cy="14.5" r="0.6" fill="#8c8c8c" />
                                    </svg>
                                }
                            />
                        </div>
                        <div className="mt-5 flex justify-end pr-3">
                            <button type="button" onClick={() => open("forgot")} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-[#957e4e]">Forgot Password</button>
                        </div>
                        <button type="submit" className="mt-8.5 h-13.75 w-full cursor-pointer rounded-lg border-0 bg-[#957e4e] text-[22px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition hover:opacity-90">Login</button>
                    </form>
                    <p className="mt-6 mb-0 text-center font-roboto text-sm text-black">
                        Don&apos;t have an account? <Link href="/register" className="font-sans text-sm font-bold text-[#957e4e] no-underline">Register</Link>
                    </p>
                </div>
            </main>
        </>
    )
}
