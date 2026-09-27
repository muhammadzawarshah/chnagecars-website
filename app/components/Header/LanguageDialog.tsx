"use client"

import { createPortal } from "react-dom"
import { languages } from "../Data/translations"
import { useLanguage } from "../Language/LanguageContext"

export default function LanguageDialog({ onClose }: { onClose: () => void }) {

    const { language, setLanguage } = useLanguage();

    return createPortal(
        <>
            <div onClick={onClose} className="fixed inset-0 z-900 flex items-center justify-center bg-black/54">
                <div onClick={(e) => e.stopPropagation()} className="w-[calc(100%-80px)] max-w-130 rounded-[20px] bg-white px-6 pt-[18.5px] pb-[40.7px]">
                    {languages.map((item) => (
                        <button
                            key={item.code}
                            onClick={() => { setLanguage(item.code); onClose(); }}
                            className="mb-[19.73px] flex h-[53.33px] w-full cursor-pointer items-center rounded-md border-0 bg-white pl-4 text-left shadow-[0_0.5px_2.5px_rgba(0,0,0,0.16)] last:mb-0"
                        >
                            {language === item.code ? (
                                <span className="flex size-[25.33px] shrink-0 items-center justify-center rounded-full bg-[#957e4e]">
                                    <span className="size-[5.33px] rounded-full bg-white"></span>
                                </span>
                            ) : (
                                <span className="size-[25.33px] shrink-0 rounded-full bg-white shadow-[0_0_2px_rgba(0,0,0,0.2)]"></span>
                            )}
                            <span className="ml-[14.67px] font-roboto text-[18.9px] text-black">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>,
        document.body
    )
}
