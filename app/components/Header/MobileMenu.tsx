<<<<<<< HEAD
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DrawerLink, drawerSearch, drawerSections } from "../Data/navigation"
import { useLanguage } from "../Language/LanguageContext"
import { usePopup } from "../Popups/PopupContext"
import MobileMenuSection from "./MobileMenuSection"
import MenuIcon from "./MenuIcon"

export default function MobileMenu({ open, onClose }: { open: boolean, onClose: () => void }) {

    const { t } = useLanguage();
    const { runAction } = usePopup();
    const [openSections, setOpenSections] = useState<number[]>([]);
=======
﻿"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { mobileSections, mobileSocialLinks, NavLink } from "../Data/navigation"
import { usePopup } from "../Popups/PopupContext"
import MobileMenuSection from "./MobileMenuSection"

export default function MobileMenu({ open, onClose }: { open: boolean, onClose: () => void }) {

    const { runAction } = usePopup();
    const [openSections, setOpenSections] = useState<string[]>([]);
>>>>>>> origin/main

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

<<<<<<< HEAD
    function toggleSection(index: number) {
        setOpenSections((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
    }

    function handleLink(e: React.MouseEvent, link: DrawerLink) {
        if (!link.action) return;
        e.preventDefault();
        onClose();
        runAction(link.action);
=======
    function toggleSection(label: string) {
        setOpenSections((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
    }

    function handleItem(e: React.MouseEvent, item: NavLink) {
        if (!item.action) return;
        e.preventDefault();
        onClose();
        runAction(item.action);
>>>>>>> origin/main
    }

    return (
        <>
<<<<<<< HEAD
            <div onClick={onClose} className={`fixed inset-0 z-998 bg-black/45 transition-opacity duration-250 min-[1112px]:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}></div>
            <nav
                aria-label="Mobile navigation"
                className={`fixed top-0 left-0 z-999 flex h-dvh w-[78%] max-w-117 flex-col overflow-hidden rounded-r-2xl bg-white transition-transform duration-250 ease-out min-[1112px]:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="relative h-[105.33px] shrink-0 border-b border-[#cac4d0]">
                    <Link href="/" onClick={onClose} className="absolute top-[32.67px] left-1/2 block w-42 -translate-x-1/2">
                        <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="block w-full" />
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto pt-[9.33px]">
                    <a href={drawerSearch.href} className="flex h-[62px] items-center pl-7 no-underline">
                        <MenuIcon icon={drawerSearch.icon} />
                        <span className="ml-[14.5px] text-[14.4px] text-[#222]">{t.menuSearch}</span>
                    </a>
                    {drawerSections.map((section, index) => (
                        <MobileMenuSection
                            key={section.icon}
                            section={section}
                            title={t.menu[index].title}
                            items={t.menu[index].items}
                            open={openSections.includes(index)}
                            onToggle={() => toggleSection(index)}
                            onLinkClick={handleLink}
=======
            <nav
                aria-label="Mobile navigation"
                className={`fixed top-0 left-0 z-999 flex h-[101dvh] w-full max-w-190 flex-col overflow-hidden bg-[#1e1e1e] transition-transform duration-320 ease-in-out min-[1112px]:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="relative flex h-20 shrink-0 items-center justify-center gap-3.75 bg-[#1e1e1e] px-4">
                    <Link href="/" onClick={onClose}>
                        <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="inline h-6.25 align-baseline" />
                    </Link>
                    <span className="block h-11.25 w-0.5 shrink-0 bg-gold"></span>
                    <a href="https://www.changecars.co.za/concierge-service">
                        <img src="/img/logo.svg" alt="Concierge Service logo" className="inline h-6.25 align-baseline" />
                    </a>
                    <button onClick={onClose} aria-label="Close menu" className="absolute top-3.75 right-3.75 size-8 cursor-pointer border-0 bg-transparent px-1.5 text-[22px] text-white">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain bg-[#1e1e1e] [&::-webkit-scrollbar]:w-0.75 [&::-webkit-scrollbar-thumb]:rounded-xs [&::-webkit-scrollbar-thumb]:bg-gold">
                    <a href="https://www.changecars.co.za/" className="flex h-12.5 cursor-pointer items-center gap-3 border-b border-charcoal bg-gold px-4 no-underline">
                        <img src="/img/mobile-menu/search.svg" alt="" className="size-6 shrink-0" />
                        <span className="text-lg font-bold text-white uppercase">Search Vehicles</span>
                    </a>
                    {mobileSections.map((section) => (
                        <MobileMenuSection
                            key={section.label}
                            section={section}
                            open={openSections.includes(section.label)}
                            onToggle={() => toggleSection(section.label)}
                            onItemClick={handleItem}
>>>>>>> origin/main
                        />
                    ))}
                </div>

<<<<<<< HEAD
                <div className="flex h-11.5 shrink-0 items-center border-t border-[#cac4d0] pl-[20.67px] text-[11.5px] text-[#bdbdbd]">
                    ChangeCars © 2026
=======
                <div className="shrink-0 bg-[#1e1e1e] px-4 pt-3.5 pb-7.5 text-center">
                    <div className="mb-3 flex justify-center gap-3.5">
                        {mobileSocialLinks.map((social) => (
                            <a key={social.label} href={social.href} target="_blank" rel="noopener" aria-label={social.label} className="flex size-8.5 cursor-pointer items-center justify-center rounded-full no-underline transition-colors duration-150 hover:bg-gold">
                                <img src={social.icon} alt="" width={social.width} height={20} />
                            </a>
                        ))}
                    </div>
                    <div className="text-white">
                        <a href="tel:+27861248248" className="text-xs leading-[1.7] text-white no-underline">0861 248 248</a> &nbsp;|&nbsp; <a href="mailto:info@changecars.co.za" className="text-xs leading-[1.7] text-white no-underline">info@changecars.co.za</a>
                    </div>
>>>>>>> origin/main
                </div>
            </nav>
        </>
    )
}
