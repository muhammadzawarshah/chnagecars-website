"use client"

import { createContext, ReactNode, useContext, useSyncExternalStore } from "react"
import { LanguageCode, languages, Translation, translations } from "../Data/translations"

type LanguageContextValue = {
    language: LanguageCode
    setLanguage: (language: LanguageCode) => void
    t: Translation
}

const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {}, t: translations.en });

const listeners = new Set<() => void>();
let chosen: LanguageCode | null = null;

function isLanguage(value: string | null): value is LanguageCode {
    return languages.some((item) => item.code === value);
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
}

function getSnapshot(): LanguageCode {
    if (chosen) return chosen;
    try {
        const saved = localStorage.getItem("language");
        if (isLanguage(saved)) return saved;
    } catch {}
    return "en";
}

function getServerSnapshot(): LanguageCode {
    return "en";
}

function setLanguage(value: LanguageCode) {
    chosen = value;
    try {
        localStorage.setItem("language", value);
    } catch {}
    listeners.forEach((listener) => listener());
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export default function LanguageProvider({ children }: { children: ReactNode }) {

    const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}
