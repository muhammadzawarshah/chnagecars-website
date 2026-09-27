import Link from "next/link"
import { footerColumns, footerInfoLinks, socialLinks } from "../Data/navigation"
import FooterLink from "./FooterLink"
import Newsletter from "./Newsletter"

const dividerLeft = "before:absolute before:top-1/2 before:left-0 before:block before:h-32.5 before:-translate-y-1/2 before:border-l before:border-dotted before:border-gold before:content-[''] max-[526px]:before:top-auto max-[526px]:before:bottom-0 max-[526px]:before:left-1/2 max-[526px]:before:h-px max-[526px]:before:w-60 max-[526px]:before:max-w-[80%] max-[526px]:before:-translate-x-1/2 max-[526px]:before:translate-y-0 max-[526px]:before:border-l-0 max-[526px]:before:border-b";
const dividerRight = "after:absolute after:top-1/2 after:right-0 after:block after:h-32.5 after:-translate-y-1/2 after:border-l after:border-dotted after:border-gold after:content-[''] max-[526px]:after:hidden";
const column = "relative float-left inline w-1/4 pl-10 max-[892px]:mb-7.5 max-[892px]:w-1/2 max-[526px]:w-full max-[526px]:pb-7.5 max-[526px]:pl-0";

export default function Footer() {
    return (
        <>
            <footer className="relative z-4 clear-both bg-ink">
                <div className="relative z-5 mx-auto w-full max-w-350 overflow-hidden px-5 pt-12.5 pb-7.5 max-[526px]:pt-6.25">
                    <div className="float-left mr-10 pt-5 pb-7.5 max-[526px]:float-none max-[526px]:mx-auto max-[526px]:block max-[526px]:w-full max-[526px]:max-w-91 max-[526px]:p-0">
                        <div className="flex w-full max-w-90.5 items-center">
                            <Link href="/" className="block w-[45%] max-[981px]:pt-2.5 max-[981px]:pb-5 max-[526px]:p-0">
                                <img src="/img/footer-2-logo.png" alt="Home" className="block h-auto w-full" />
                            </Link>
                            <span className="mx-2.5 block h-12.75 w-0.5 shrink-0 bg-gold"></span>
                            <a href="https://www.changecars.co.za/insurance/car-and-warranty-solutions" className="w-1/2">
                                <img src="/img/logo.svg" alt="Concierge Service logo" className="block w-full" />
                            </a>
                        </div>
                        <nav className="pt-5 pl-10 max-[526px]:pt-10 max-[526px]:pl-0">
                            <ul className="m-0 p-0">
                                <li className="mb-5 flow-root text-[13px] max-[526px]:flex max-[526px]:flex-wrap max-[526px]:justify-center max-[526px]:gap-3.75">
                                    {socialLinks.map((social) => (
                                        <a key={social.label} href={social.href} title={social.label} target="_blank" className="float-left mr-3.75 mb-2.5 block text-white max-[676px]:text-[15px] max-[526px]:m-0! max-[526px]:w-fit">
                                            <img src={social.icon} alt={social.label} style={{ width: social.width }} className="inline-block h-auto align-middle transition duration-200 hover:scale-110" />
                                        </a>
                                    ))}
                                </li>
                                <li className="mb-5 text-[13px] max-[526px]:flex max-[526px]:flex-wrap max-[526px]:justify-center max-[526px]:gap-3.75">
                                    <a href="tel:0861248248" className="mb-2.5 block text-white no-underline hover:text-gold max-[676px]:text-[15px] max-[526px]:w-full max-[526px]:text-center">0861 248 248</a>
                                    <a href="mailto:info@changecars.co.za" className="mb-2.5 block text-white no-underline hover:text-gold max-[676px]:text-[15px] max-[526px]:w-full max-[526px]:text-center">info@changecars.co.za</a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    <div className="float-left inline w-[calc(100%-260px)] max-w-230 pt-5 pb-7.5 max-[1362px]:w-full max-[1362px]:max-w-none max-[526px]:pt-11.25">
                        <div className={`${column} ${dividerLeft}`}>
                            {footerInfoLinks.map((link) => (
                                <FooterLink key={link.label} link={link} />
                            ))}
                        </div>
                        {footerColumns.map((links, index) => (
                            <nav key={index} className={`${column} ${index < 2 ? dividerLeft : ""} ${index === 1 ? dividerRight : ""}`}>
                                {links.map((link) => (
                                    <FooterLink key={link.label} link={link} />
                                ))}
                            </nav>
                        ))}
                    </div>

                    <Newsletter />
                </div>

                <div className="w-full bg-[#2f2f2f] text-center">
                    <div className="relative z-4 mx-auto w-full max-w-350 px-5">
                        <p className="m-0 py-3.75 text-[13px] leading-4.5 font-bold text-white">
                            Copyright © 2026 CHANGECARS. All Rights Reserved
                        </p>
                    </div>
                </div>
            </footer>
        </>
    )
}
