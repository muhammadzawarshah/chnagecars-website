"use client"

import { ReactNode } from "react"

// Desktop jumps to the enquiry form in the side column; smaller screens open it as a popup.
export function openEnquiry() {
    const field = document.getElementById("enquiry-name");
    if (window.innerWidth >= 1039 && field) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        field.focus({ preventScroll: true });
    } else {
        window.dispatchEvent(new Event("open-enquiry"));
    }
}

export function openFinance() {
    window.dispatchEvent(new Event("open-finance"));
}

type ActionButtonProps = {
    action: "enquiry" | "finance"
    className: string
    children: ReactNode
}

export default function ActionButton({ action, className, children }: ActionButtonProps) {
    return (
        <>
            <button type="button" onClick={action === "enquiry" ? openEnquiry : openFinance} className={`cursor-pointer border-0 font-sans ${className}`}>{children}</button>
        </>
    )
}
