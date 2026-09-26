"use client"

import { NavLink } from "../Data/navigation"
import { usePopup } from "../Popups/PopupContext"

const linkClass = "m-0 block cursor-pointer text-[13px] leading-7.25 font-medium text-white no-underline hover:text-gold max-[676px]:text-[15px] max-[526px]:text-center";

export default function FooterLink({ link }: { link: NavLink }) {

    const { runAction } = usePopup();

    if (link.children) {
        return (
            <div className="group relative">
                <span className={linkClass}>{link.label}</span>
                <ul className="absolute top-[calc(100%+5px)] left-0 z-2 m-0 max-h-0 w-fit list-none overflow-hidden rounded-b-[9px] bg-menu p-0 shadow-[3px_3px_12px_rgba(0,0,0,0.2)] transition-[max-height] duration-500 group-hover:max-h-50 max-[526px]:left-1/2 max-[526px]:-translate-x-1/2">
                    {link.children.map((child) => (
                        <li key={child.label} className="cursor-pointer px-5 py-1.25 whitespace-nowrap text-white">
                            <a href={child.href} className="block text-[13px] leading-7.25 font-medium text-white no-underline hover:text-gold max-[676px]:text-[15px]">{child.label}</a>
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    return (
        <a
            href={link.href}
            onClick={(e) => { if (link.action) { e.preventDefault(); runAction(link.action); } }}
            target={link.external ? "_blank" : undefined}
            className={linkClass}
        >
            {link.label}
        </a>
    )
}
