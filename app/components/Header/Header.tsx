"use client"

import Link from "next/link"
import { useState } from "react"
import { mainMenus, subNavLinks } from "../Data/navigation"
import NavDropdown from "./NavDropdown"
import MobileMenu from "./MobileMenu"
<<<<<<< HEAD
import AppBar from "./AppBar"
import LanguagePill from "./LanguagePill"
=======
>>>>>>> origin/main

export default function Header() {

    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
<<<<<<< HEAD
            <header className="relative z-80 max-[1111px]:fixed max-[1111px]:top-0 max-[1111px]:left-0 max-[1111px]:h-15 max-[1111px]:w-full max-[1111px]:bg-ink max-[1111px]:shadow-[0_0_5px_rgba(0,0,0,0.6)] max-[981px]:hidden">
=======
            <header className="relative z-80 max-[1111px]:fixed max-[1111px]:top-0 max-[1111px]:left-0 max-[1111px]:h-15 max-[1111px]:w-full max-[1111px]:bg-ink max-[1111px]:shadow-[0_0_5px_rgba(0,0,0,0.6)]">
>>>>>>> origin/main
                <div className="mx-auto flow-root w-full max-w-350 py-5 pr-5 max-[1111px]:h-15 max-[1111px]:px-5 max-[1111px]:pt-2 max-[1111px]:pb-0">
                    <span onClick={() => setMenuOpen(!menuOpen)} className="absolute top-0 left-0 z-1 hidden h-15 w-17.5 cursor-pointer pt-3.5 max-[1111px]:block">
                        <span className="mx-auto my-1.5 block h-0.5 w-6.25 bg-white"></span>
                        <span className="mx-auto my-1.5 block h-0.5 w-6.25 bg-white"></span>
                        <span className="mx-auto my-1.5 block h-0.5 w-6.25 bg-white"></span>
                    </span>

                    <div className="float-left flex w-full max-w-100 items-center gap-2.5 max-[1281px]:max-w-87.5 max-[1171px]:max-w-75 max-[1111px]:relative max-[1111px]:-top-1.5 max-[1111px]:float-none max-[1111px]:mx-auto max-[1111px]:max-w-87.5 max-[1111px]:justify-center">
                        <Link href="/" className="block w-full max-w-50 max-[1111px]:w-[34%]">
                            <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="block h-[56.75px] w-full" />
                        </Link>
                        <span className="block h-11.25 w-0.5 shrink-0 bg-gold"></span>
                        <a href="https://www.changecars.co.za/insurance/car-and-warranty-solutions" className="block w-full max-w-47.5 animate-logo-pop max-[1111px]:w-[34%]">
                            <img src="/img/logo.svg" alt="Concierge Service logo" className="block h-9.25 w-full object-contain" />
                        </a>
                    </div>

                    <nav className="float-right max-w-205.5 max-[1201px]:max-w-190 max-[1111px]:hidden">
                        <div className="flex flex-row-reverse flex-wrap gap-x-2">
                            {mainMenus.map((menu) => (
                                <NavDropdown key={menu.label} menu={menu} />
                            ))}
                        </div>
                        <div className="relative mx-auto mt-0 flex w-[calc(100%-21px)] justify-end gap-3.75 pt-4.5 text-center">
                            {subNavLinks.map((link) => (
                                link.children ? (
                                    <div key={link.label} className="group relative">
                                        <a className="cursor-pointer text-sm leading-5 font-normal whitespace-nowrap text-white hover:text-gold">{link.label}</a>
                                        <ul className="absolute top-[calc(100%+5px)] left-1/2 z-5 m-0 max-h-0 w-fit -translate-x-1/2 list-none overflow-hidden rounded-b-[9px] bg-menu p-0 shadow-[3px_3px_12px_rgba(0,0,0,0.2)] transition-[max-height] duration-100 group-hover:max-h-125">
                                            {link.children.map((child) => (
                                                <li key={child.label} className="cursor-pointer whitespace-nowrap transition-colors duration-500 hover:bg-menu-hover">
                                                    <a href={child.href} className="block px-5 py-2.5 text-left text-sm leading-5 text-white no-underline">{child.label}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <a key={link.label} href={link.href} className="text-sm leading-5 font-normal whitespace-nowrap text-white no-underline hover:text-gold">
                                        {link.label}
                                    </a>
                                )
                            ))}
<<<<<<< HEAD
                            <LanguagePill />
                        </div>
                    </nav>

                    <LanguagePill className="absolute top-0 right-5 hidden h-15 max-[1111px]:flex" />
                </div>
            </header>
            <AppBar onMenu={() => setMenuOpen(true)} />
=======
                        </div>
                    </nav>
                </div>
            </header>
>>>>>>> origin/main
            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    )
}
