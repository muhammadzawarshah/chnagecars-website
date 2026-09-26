import { MobileSection, NavLink } from "../Data/navigation"

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
        </div>
    )
}
