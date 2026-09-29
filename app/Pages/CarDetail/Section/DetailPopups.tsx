"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import EnquiryForm from "./EnquiryForm"

type DetailPopupsProps = {
    title: string
    dealer: string
    logo: string
}

// Listens for the page's "Message Dealer" buttons on screens without the side form.
export default function DetailPopups({ title, dealer, logo }: DetailPopupsProps) {

    const [enquiry, setEnquiry] = useState(false);

    useEffect(() => {
        const showEnquiry = () => setEnquiry(true);
        window.addEventListener("open-enquiry", showEnquiry);
        return () => {
            window.removeEventListener("open-enquiry", showEnquiry);
        };
    }, []);

    useEffect(() => {
        if (!enquiry) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [enquiry]);

    return (
        <>
            {enquiry && createPortal(
                <div onClick={() => setEnquiry(false)} className="fixed inset-0 z-900 overflow-y-auto bg-black/70 p-5 font-sans">
                    <div onClick={(event) => event.stopPropagation()} className="relative mx-auto my-5 w-full max-w-100 rounded-[10px] bg-[#1e1e1e] px-5 pt-8.5 pb-5">
                        <button type="button" onClick={() => setEnquiry(false)} aria-label="Close" className="absolute top-4 right-4 flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M1 1l12 12M13 1L1 13" /></svg>
                        </button>
                        <EnquiryForm title={title} dealer={dealer} logo={logo} idPrefix="popup-enquiry" />
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
