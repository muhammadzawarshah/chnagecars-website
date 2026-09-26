"use client"

import { useEffect, useRef, useState } from "react"
import { NavLink, NavMenu } from "../Data/navigation"
import { usePopup } from "../Popups/PopupContext"

export default function NavDropdown({ menu }: { menu: NavMenu }) {

    const { runAction } = usePopup();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isLogin = menu.label === "Login";

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function handleItem(e: React.MouseEvent, item: NavLink) {
        if (!item.action) return;
        e.preventDefault();
        setOpen(false);
        runAction(item.action);
    }

    const pill = "block h-7.5 cursor-pointer rounded-[25px] border border-transparent bg-black/60 bg-size-[14px] bg-no-repeat pr-4 pl-8 text-sm leading-7 font-normal whitespace-nowrap text-white no-underline transition duration-300 hover:border-ink hover:bg-ink";

    if (menu.href) {
        return (
            <a href={menu.href} className={`${pill} bg-position-[10px_center]`} style={{ backgroundImage: `url(${menu.icon})` }}>
                {menu.label}
            </a>
        )
    }

    return (
        <>
            <div ref={ref} className="relative h-7.5">
                <a onClick={() => setOpen(!open)} className={`${pill} bg-position-[10px_9px]`} style={{ backgroundImage: `url(${menu.icon})` }}>
                    {menu.label}
                </a>
                <ul className={`absolute top-[calc(100%+5px)] z-5 m-0 w-fit list-none rounded-b-[9px] bg-menu p-0 shadow-[3px_3px_12px_rgba(0,0,0,0.2)] transition-[max-height] duration-100 -translate-x-1/2 ${isLogin ? "left-0" : "left-1/2"} ${open ? "max-h-125" : "max-h-0 overflow-hidden"}`}>
                    {menu.items?.map((item) => (
                        <li key={item.label} className="relative cursor-pointer whitespace-nowrap text-white transition-colors duration-500 last:hover:rounded-b-[10px] hover:bg-menu-hover">
                            <a href={item.href} onClick={(e) => handleItem(e, item)} target={item.external ? "_blank" : undefined} className="block h-full w-full px-5 py-2.5 text-white no-underline">
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
