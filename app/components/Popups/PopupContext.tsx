"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react"

export type PopupName = "login" | "register" | "forgot" | "help" | "info" | "screan"

export type NavAction = "login" | "register" | "screan" | "newsletter"

type PopupContextValue = {
    active: PopupName | null
    open: (name: PopupName) => void
    close: () => void
    runAction: (action: NavAction) => void
}

const PopupContext = createContext<PopupContextValue | null>(null);

export default function PopupProvider({ children }: { children: ReactNode }) {

    const [active, setActive] = useState<PopupName | null>(null);

    useEffect(() => {
        document.body.style.overflowY = active && active !== "help" ? "hidden" : "";
    }, [active]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setActive(null);
        }
        document.addEventListener("keyup", handleKey);
        return () => document.removeEventListener("keyup", handleKey);
    }, []);

    function runAction(action: NavAction) {
        if (action === "newsletter") {
            const target = document.getElementById("newsletter");
            if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + 30, behavior: "smooth" });
            return;
        }
        setActive(action);
    }

    return (
        <PopupContext.Provider value={{ active, open: setActive, close: () => setActive(null), runAction }}>
            {children}
        </PopupContext.Provider>
    )
}

export function usePopup() {
    const context = useContext(PopupContext);
    if (!context) throw new Error("usePopup must be used inside PopupProvider");
    return context;
}
