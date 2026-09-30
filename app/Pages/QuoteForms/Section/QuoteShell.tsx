"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"

type QuoteShellProps = {
    background: string
    cardClass: string
    // Value my vehicle and Keep it narrow the page gutter to 10px on tablets; the photo pages keep 20px.
    narrowGutter?: boolean
    children: ReactNode
}

// Fixed photo behind a 60% black layer, with the gold card centred on top — the live enquiry pages.
export default function QuoteShell({ background, cardClass, narrowGutter = false, children }: QuoteShellProps) {

    const [sent, setSent] = useState(false);

    // Like the live pages: open scrolled to 80px below the header.
    useEffect(() => {
        const width = window.innerWidth;
        window.scrollTo(0, width >= 1201 ? 188 : width >= 1111 ? 218 : 140);
    }, []);

    function submit(event: FormEvent) {
        event.preventDefault();
        setSent(true);
    }

    return (
        <>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})` }}></div>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-black/60"></div>
            <main className={`relative px-5 font-sans ${narrowGutter ? "max-[841px]:px-2.5" : ""}`}>
                <div className="flex justify-center pt-12.5 pb-17.5 max-[1111px]:pt-25 max-[1111px]:pb-10 max-[981px]:pt-11">
                    <form data-form-card onSubmit={submit} className={`w-full overflow-hidden rounded-xl bg-gold ${cardClass}`}>
                        {sent ? (
                            <div className="flex min-h-100 flex-col items-center justify-center px-5 py-12.5 text-center">
                                <h2 className="m-0 text-[32px] font-bold text-white uppercase">Thank you</h2>
                                <p className="mx-auto my-6.25 max-w-85 text-xl font-extralight text-white">Your enquiry has been sent. Our team will be in touch with you shortly.</p>
                            </div>
                        ) : children}
                    </form>
                </div>
            </main>
        </>
    )
}
