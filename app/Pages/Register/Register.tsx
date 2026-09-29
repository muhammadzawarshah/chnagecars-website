"use client"

import { FormEvent, ReactNode, useState } from "react"
import Link from "next/link"
import LoginField from "../Login/Section/LoginField"

type SellerType = "private" | "dealer"

const emptyForm = { username: "", email: "", firstName: "", lastName: "", password: "" };

const personIcon = (
    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" stroke="#8c8c8c" strokeWidth="1.3">
        <circle cx="9" cy="5.5" r="4.25" />
        <path d="M1 18.5c.7-4 3.9-6 8-6s7.3 2 8 6" strokeLinecap="round" />
    </svg>
);

const fields: { key: keyof typeof emptyForm, type: string, placeholder: string, icon: ReactNode }[] = [
    { key: "username", type: "text", placeholder: "Enter Username", icon: personIcon },
    {
        key: "email",
        type: "email",
        placeholder: "Enter Your Email Address",
        icon: (
            <svg width="20" height="15" viewBox="0 0 20 15" fill="none" stroke="#8c8c8c" strokeWidth="1.3">
                <rect x="0.75" y="0.75" width="18.5" height="13.5" rx="1" />
                <path d="M1 1.5l9 7 9-7" />
            </svg>
        ),
    },
    { key: "firstName", type: "text", placeholder: "Enter First Name", icon: personIcon },
    { key: "lastName", type: "text", placeholder: "Enter Last Name", icon: personIcon },
    {
        key: "password",
        type: "password",
        placeholder: "Enter Your Password",
        icon: (
            <svg width="16" height="21" viewBox="0 0 16 21" fill="none" stroke="#8c8c8c" strokeWidth="1.3">
                <rect x="0.75" y="8.75" width="14.5" height="11.5" rx="2" />
                <path d="M3.5 8.5V5.5a4.5 4.5 0 0 1 9 0v3" />
                <circle cx="5" cy="14.5" r="0.6" fill="#8c8c8c" />
                <circle cx="8" cy="14.5" r="0.6" fill="#8c8c8c" />
                <circle cx="11" cy="14.5" r="0.6" fill="#8c8c8c" />
            </svg>
        ),
    },
];

const requiredMessages: Record<keyof typeof emptyForm, string> = {
    username: "Username is required",
    email: "Email is required",
    firstName: "First name is required",
    lastName: "Last name is required",
    password: "Password is required",
};

export default function Register() {

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
    const [sellerType, setSellerType] = useState<SellerType>("private");
    const [done, setDone] = useState(false);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const next: Partial<Record<keyof typeof emptyForm, string>> = {};
        for (const field of fields) {
            if (!form[field.key].trim()) next[field.key] = requiredMessages[field.key];
        }
        if (!next.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Please enter a valid email address";
        setErrors(next);
        if (Object.keys(next).length === 0) setDone(true);
    }

    const toggle = "h-9.25 cursor-pointer border-0 px-4.75 font-roboto text-[13px] font-bold transition";

    return (
        <>
            <main className="bg-[#f8fafd] px-5 pt-5 pb-20 max-[981px]:-mt-14">
                <div className="mx-auto w-full max-w-150">
                    <Link href="/" aria-label="Back" className="flex size-6.5 items-center justify-center">
                        <svg width="20" height="17" viewBox="0 0 20 17" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 8.5H2M8.5 2L2 8.5 8.5 15" />
                        </svg>
                    </Link>
                    <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="mx-auto mt-9.5 block h-auto w-75 max-w-full" />
                    <h1 className="mt-11.5 mb-0 text-center text-2xl leading-[1.2] font-bold text-[#957e4e]">Register</h1>
                    <p className="mt-4 mb-0 text-center font-roboto text-[clamp(10px,3.1vw,14px)] text-[#949494]">Please create your account to be associated with the application</p>
                    {done ? (
                        <div className="mt-12 text-center">
                            <p className="m-0 font-roboto text-base text-black">Your account is ready! Please check your mail to activate your account</p>
                            <Link href="/login" className="mt-8.5 flex h-12.75 w-full items-center justify-center rounded-lg bg-[#957e4e] text-[22px] font-bold text-white no-underline shadow-[0_2px_4px_rgba(0,0,0,0.15)]">Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="mt-12">
                            <div className="flex flex-col gap-7">
                                {fields.map((field) => (
                                    <LoginField
                                        key={field.key}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        value={form[field.key]}
                                        error={errors[field.key] ?? ""}
                                        onChange={(value) => setForm({ ...form, [field.key]: value })}
                                        icon={field.icon}
                                    />
                                ))}
                            </div>
                            <div className="mt-5 flex justify-center">
                                <div className="flex overflow-hidden rounded-md bg-[#ebebeb]">
                                    <button type="button" onClick={() => setSellerType("private")} aria-pressed={sellerType === "private"} className={`${toggle} ${sellerType === "private" ? "bg-[#957e4e] text-white" : "bg-transparent text-black"}`}>Private Seller</button>
                                    <button type="button" onClick={() => setSellerType("dealer")} aria-pressed={sellerType === "dealer"} className={`${toggle} ${sellerType === "dealer" ? "bg-[#957e4e] text-white" : "bg-transparent text-black"}`}>Dealer</button>
                                </div>
                            </div>
                            <button type="submit" className="mt-4.75 h-12.75 w-full cursor-pointer rounded-lg border-0 bg-[#957e4e] text-[22px] font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition hover:opacity-90">Register</button>
                        </form>
                    )}
                    <p className="mt-5 mb-0 text-center font-roboto text-sm text-black">
                        Already have an account? <Link href="/login" className="font-sans text-sm font-bold text-[#957e4e] no-underline">Login</Link>
                    </p>
                </div>
            </main>
        </>
    )
}
