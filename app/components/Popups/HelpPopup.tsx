"use client"

import { usePopup } from "./PopupContext"
import { carSearchHref } from "@/app/lib/cars/search"

const site = "https://www.changecars.co.za";

const helpLinks = [
    { label: "Looking to sell your vehicle", href: "/sell-your-vehicle" },
    { label: "Looking to buy brand new", href: `${site}/new-vehicle-quote` },
    { label: "Looking for insurance", href: `${site}/insurance/discovery-car-insurance` },
    { label: "Looking for quote comparisons", href: `${site}/beat-my-quote` },
    { label: "Looking for advice", href: `${site}/keep-it-or-changecars` },
    { label: "Help me find", href: `${site}/help-me-find` },
    { label: "I just want to search for vehicles", href: carSearchHref({}) },
];

export default function HelpPopup() {

    const { active, close } = usePopup();

    if (active !== "help") return null;

    const item = "block border-b border-[#d0d0d0] bg-[url(/img/cta-arrow.svg)] bg-position-[right_center] bg-no-repeat last:border-b-0 mr-0.75";
    const link = "block h-12.5 cursor-pointer text-base leading-12.5 font-medium text-[#464646] no-underline hover:text-gold mr-2.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";

    return (
        <>
            <div onClick={close} className="fixed top-0 left-0 z-5000 block h-full w-full bg-[rgba(72,72,74,0.6)]"></div>
            <div className="fixed right-13.25 bottom-40 z-500001 block w-88.75 max-w-[calc(100%-20px)] max-[401px]:right-2.5 max-[401px]:p-5 rounded-[10px] bg-white p-12.5 max-[1441px]:bottom-10 max-[537px]:right-7.5 max-[537px]:bottom-7.5 max-[537px]:p-7.5">
                <a onClick={close} className="absolute top-1.25 right-1.25 block size-11.25 cursor-pointer bg-[url(/img/close-black.svg)] bg-center bg-no-repeat opacity-60"></a>
                <p className="mx-0 mt-0 mb-3 text-2xl leading-7 font-light text-[#2f2f2f]">How can we <span className="font-bold text-gold">Help you?</span></p>
                <ul className="m-0 -mr-3 block h-full max-h-100 overflow-auto p-0">
                    {helpLinks.map((help) => (
                        <li key={help.label} className={item}>
                            <a href={help.href} className={link}>{help.label}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}
