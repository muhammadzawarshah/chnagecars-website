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

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    function toggleSection(index: number) {
        setOpenSections((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
    }

    function handleLink(e: React.MouseEvent, link: DrawerLink) {
        if (!link.action) return;
        e.preventDefault();
        onClose();
        runAction(link.action);
    }

    return (
        <>
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
                        />
                    ))}
                </div>

                <div className="flex h-11.5 shrink-0 items-center border-t border-[#cac4d0] pl-[20.67px] text-[11.5px] text-[#bdbdbd]">
                    ChangeCars © 2026
                </div>
            </nav>
        </>
    )
}
