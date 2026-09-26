"use client"

import { mobileLinks, NavLink } from "../Data/navigation"
import { NavAction, usePopup } from "../Popups/PopupContext"

export default function MobileMenu({ open, onClose }: { open: boolean, onClose: () => void }) {

    const { runAction } = usePopup();

    function handleAction(e: React.MouseEvent, action?: NavAction) {
        if (!action) return;
        e.preventDefault();
        onClose();
        runAction(action);
    }

    const link = "mb-px block h-9.75 cursor-pointer bg-white px-3.75 text-left text-sm leading-9.5 text-gold no-underline transition duration-300 hover:bg-gold hover:text-white max-[982px]:text-lg";
    const button = "mb-px block h-8.75 w-full cursor-pointer bg-white bg-[url(/img/login_icon_gold.svg)] bg-size-[14px] bg-position-[14px_13px] bg-no-repeat pl-12.5 text-left text-sm leading-8.75 text-gold hover:bg-ink max-[981px]:text-lg";

    return (
        <>
            <nav className={`absolute top-15 z-200 hidden h-[calc(100vh-60px)] w-full overflow-auto bg-[#dbdbdb] p-0 transition-all duration-100 max-[1111px]:block ${open ? "left-0" : "-left-full"}`}>
                <div>
                    {mobileLinks.map((item: NavLink) => (
                        <a key={item.label} href={item.href} onClick={(e) => handleAction(e, item.action)} target={item.external ? "_blank" : undefined} className={link}>
                            {item.label}
                        </a>
                    ))}
                </div>
                <a onClick={(e) => handleAction(e, "register")} className={button}>Dealer registration</a>
                <a onClick={(e) => handleAction(e, "login")} className={button}>Login</a>
                <div>
                    <a href="https://www.changecars.co.za/contact-us" className={link}>Contact</a>
                </div>
            </nav>
        </>
    )
}
