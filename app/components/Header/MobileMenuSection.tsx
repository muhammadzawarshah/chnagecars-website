<<<<<<< HEAD
import { DrawerLink, DrawerSection } from "../Data/navigation"
import MenuIcon from "./MenuIcon"

type MobileMenuSectionProps = {
    section: DrawerSection
    title: string
    items: string[]
    open: boolean
    onToggle: () => void
    onLinkClick: (e: React.MouseEvent, link: DrawerLink) => void
}

export default function MobileMenuSection({ section, title, items, open, onToggle, onLinkClick }: MobileMenuSectionProps) {
    return (
        <div>
            <button onClick={onToggle} aria-expanded={open} className="relative flex h-15 w-full cursor-pointer items-center border-0 bg-transparent p-0 pt-0.5 pl-7 text-left">
                <MenuIcon icon={section.icon} />
                <span className="ml-[14.5px] text-[14.4px] text-[#222]">{title}</span>
                <svg width="10.67" height="10.67" viewBox="0 0 16 16" fill="none" stroke="#9e9e9e" strokeWidth="2" className="absolute top-1/2 right-[32.67px] -translate-y-1/2">
                    <path d={open ? "M0 8h16" : "M0 8h16M8 0v16"} />
                </svg>
            </button>
            {open && (
                <div className="relative pb-2">
                    <span className="absolute top-0 bottom-[7.67px] left-12 w-px bg-[#9e9e9e]"></span>
                    {section.links.map((link, index) => (
                        <a
                            key={index}
                            href={link.href ?? "#"}
                            onClick={(e) => onLinkClick(e, link)}
                            target={link.external ? "_blank" : undefined}
                            className="flex h-12 items-center pl-[66px] text-[12.4px] text-[#757575] no-underline"
                        >
                            <span className="size-[3.3px] shrink-0 rounded-full bg-[#9e9e9e]"></span>
                            <span className="ml-[4.7px]">{items[index]}</span>
                        </a>
                    ))}
                </div>
            )}
=======
﻿import { MobileSection, NavLink } from "../Data/navigation"

type MobileMenuSectionProps = {
    section: MobileSection
    open: boolean
    onToggle: () => void
    onItemClick: (e: React.MouseEvent, item: NavLink) => void
}

export default function MobileMenuSection({ section, open, onToggle, onItemClick }: MobileMenuSectionProps) {
    return (
        <div className="border-b border-charcoal">
            <div
                onClick={onToggle}
                role="button"
                tabIndex={0}
                aria-expanded={open}
                className="flex h-12.5 cursor-pointer items-center justify-between gap-2.5 bg-gold px-4 select-none"
            >
                <div className="flex min-w-0 items-center gap-2.5">
                    <img src={section.icon} alt="" className="size-6 shrink-0" />
                    <span className="overflow-hidden text-lg font-bold text-ellipsis whitespace-nowrap text-white uppercase">{section.label}</span>
                </div>
                <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center text-[30px] leading-none font-semibold text-[#1d1d1e]">{open ? "-" : "+"}</span>
            </div>
            <div className={`overflow-hidden bg-[#252525] transition-[max-height] duration-320 ease-in-out ${open ? "max-h-200" : "max-h-0"}`}>
                {section.items.map((item) => (
                    <a
                        key={item.label}
                        href={item.href ?? "#"}
                        onClick={(e) => onItemClick(e, item)}
                        target={item.external ? "_blank" : undefined}
                        className="flex cursor-pointer items-center justify-between py-3.25 pr-4 pl-11 text-base text-white no-underline transition-colors duration-150 hover:bg-gold"
                    >
                        {item.label}
                        <img src="/img/mobile-menu/chevron.svg" alt="" className="size-4.5 shrink-0" />
                    </a>
                ))}
            </div>
>>>>>>> origin/main
        </div>
    )
}
