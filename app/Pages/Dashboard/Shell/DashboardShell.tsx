"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode, useState } from "react"
import Icon from "../ui/Icon"
import { NavItem } from "./navigation"

type DashboardShellProps = {
    nav: NavItem[]
    roleLabel: string
    userName: string
    subtitle?: string
    banner?: ReactNode
    children: ReactNode
}

// Ink sidebar with gold accents (same palette as the public site), white top bar, light content area.
export default function DashboardShell({ nav, roleLabel, userName, subtitle, banner, children }: DashboardShellProps) {

    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const initials = userName.split(" ").map((part) => part[0]).join("").slice(0, 2);

    const isActive = (item: NavItem) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <>
            <div className="flex min-h-screen bg-[#f6f5f2] font-sans text-ink">
                {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 min-[1024px]:hidden"></div>}

                <aside className={`fixed inset-y-0 left-0 z-50 flex w-66 flex-col bg-ink text-white transition-transform duration-300 min-[1024px]:sticky min-[1024px]:top-0 min-[1024px]:h-screen min-[1024px]:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                        <Link href="/" aria-label="CHANGECARS website" className="block w-40">
                            <img src="/img/site_logo.svg" alt="CHANGECARS" className="block w-full" />
                        </Link>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex size-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-white min-[1024px]:hidden"><Icon name="close" /></button>
                    </div>
                    <div className="px-5 pt-5">
                        <span className="inline-block rounded-full border border-gold/60 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-gold uppercase">{roleLabel}</span>
                        {subtitle && <p className="mt-2 mb-0 truncate text-sm text-white/70">{subtitle}</p>}
                    </div>
                    <nav aria-label="Dashboard" className="mt-4 flex-1 overflow-y-auto px-3">
                        <ul className="m-0 list-none p-0">
                            {nav.map((item) => {
                                const active = isActive(item);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            onClick={() => setOpen(false)}
                                            className={`relative mb-1 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold no-underline transition ${active ? "bg-white/8 text-gold before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-gold" : "text-white/75 hover:bg-white/5 hover:text-white"}`}
                                        >
                                            <Icon name={item.icon} />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <div className="border-t border-white/10 p-3">
                        <Link href="/" className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/70 no-underline hover:bg-white/5 hover:text-white">
                            <Icon name="website" />
                            Back to website
                        </Link>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    {banner}
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#ebe8e1] bg-white/95 px-6 backdrop-blur max-[600px]:px-4">
                        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#e3dfd6] bg-white text-ink min-[1024px]:hidden"><Icon name="menu" /></button>
                        <p className="m-0 hidden text-sm text-[#6b6862] min-[700px]:block">Welcome back, <strong className="text-ink">{userName.split(" ")[0]}</strong></p>
                        <div className="ml-auto flex items-center gap-3">
                            <div className="text-right max-[480px]:hidden">
                                <p className="m-0 text-sm font-bold">{userName}</p>
                                <p className="m-0 text-xs text-[#6b6862]">{roleLabel}</p>
                            </div>
                            <span className="flex size-9.5 items-center justify-center rounded-full bg-gold text-sm font-bold text-white">{initials}</span>
                        </div>
                    </header>
                    <main className="mx-auto w-full max-w-350 flex-1 px-6 py-7 max-[600px]:px-4 max-[600px]:py-5">{children}</main>
                </div>
            </div>
        </>
    )
}
