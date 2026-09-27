"use client"

import { useState } from "react"
import { languages } from "../Data/translations"
import { useLanguage } from "../Language/LanguageContext"
import LanguageDialog from "./LanguageDialog"

export default function LanguagePill({ className = "" }: { className?: string }) {

    const { language } = useLanguage();
    const [open, setOpen] = useState(false);

    return (
        <>
            <a onClick={() => setOpen(true)} className={`flex cursor-pointer items-center text-sm leading-5 font-normal whitespace-nowrap text-white no-underline hover:text-gold ${className}`}>
                <svg width="14" height="14" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="14" cy="14" r="13" />
                    <ellipse cx="14" cy="14" rx="6.5" ry="13" />
                    <path d="M14 1v26M2.6 10.3h22.8M2.6 17.7h22.8" />
                </svg>
                <span className="ml-1.5">{languages.find((item) => item.code === language)?.name}</span>
                <svg width="8" height="4.6" viewBox="0 0 13 7" fill="none" stroke="currentColor" strokeWidth="1.8" className="ml-1.5">
                    <path d="M0.6 0.6l5.9 5.8 5.9-5.8" />
                </svg>
            </a>
            {open && <LanguageDialog onClose={() => setOpen(false)} />}
        </>
    )
}
