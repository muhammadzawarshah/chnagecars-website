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
            <button onClick={onToggle} aria-expanded={open} className="relative flex min-h-15 w-full cursor-pointer items-center border-0 bg-transparent p-0 pt-0.5 pr-14 pl-7 text-left max-[301px]:pr-9 max-[301px]:pl-3.5">
                <MenuIcon icon={section.icon} />
                <span className="ml-[14.5px] min-w-0 text-[14.4px] text-[#222] wrap-anywhere max-[301px]:ml-2.5">{title}</span>
                <svg width="10.67" height="10.67" viewBox="0 0 16 16" fill="none" stroke="#9e9e9e" strokeWidth="2" className="absolute top-1/2 right-[32.67px] -translate-y-1/2 max-[301px]:right-3.5">
                    <path d={open ? "M0 8h16" : "M0 8h16M8 0v16"} />
                </svg>
            </button>
            {open && (
                <div className="relative pb-2">
                    <span className="absolute top-0 bottom-[7.67px] left-12 w-px bg-[#9e9e9e] max-[301px]:left-6"></span>
                    {section.links.map((link, index) => (
                        <a
                            key={index}
                            href={link.href ?? "#"}
                            onClick={(e) => onLinkClick(e, link)}
                            target={link.external ? "_blank" : undefined}
                            className="flex min-h-12 items-center pr-3 pl-[66px] text-[12.4px] text-[#757575] no-underline max-[301px]:pl-9"
                        >
                            <span className="size-[3.3px] shrink-0 rounded-full bg-[#9e9e9e]"></span>
                            <span className="ml-[4.7px] min-w-0 wrap-anywhere">{items[index]}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
