"use client"

import { useState } from "react"
import { languages } from "../Data/translations"
import { useLanguage } from "../Language/LanguageContext"
import LanguageDialog from "./LanguageDialog"

export default function LanguageSelect() {

    const { language } = useLanguage();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button onClick={() => setOpen(true)} className="absolute top-0 right-[24.67px] flex h-14 max-[301px]:right-3 cursor-pointer items-center border-0 bg-transparent p-0">
                <svg width="18.67" height="18.67" viewBox="0 0 28 28" fill="none" stroke="#3c3c3c" strokeWidth="2">
                    <circle cx="14" cy="14" r="13" />
                    <ellipse cx="14" cy="14" rx="6.5" ry="13" />
                    <path d="M14 1v26M2.6 10.3h22.8M2.6 17.7h22.8" />
                </svg>
                <span className="ml-[13.33px] text-[16.5px] text-black max-[251px]:hidden">{languages.find((item) => item.code === language)?.name}</span>
                <svg width="9" height="5.2" viewBox="0 0 13 7" fill="none" stroke="#000" strokeWidth="1.8" className="ml-4">
                    <path d="M0.6 0.6l5.9 5.8 5.9-5.8" />
                </svg>
            </button>
            {open && <LanguageDialog onClose={() => setOpen(false)} />}
        </>
    )
}
