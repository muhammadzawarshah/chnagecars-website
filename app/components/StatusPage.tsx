import { ReactNode } from "react"

// Calm, on-brand page for "not found" and "something went wrong": the site's own colours and
// type, centred in the content area, with clear next steps.
export default function StatusPage({ code, title, message, children }: { code?: string, title: string, message: string, children?: ReactNode }) {
    return (
        <main className="flex min-h-[60vh] items-center justify-center bg-[#f8fafd] px-5 py-20 font-sans">
            <div className="w-full max-w-140 text-center">
                {code && <p className="m-0 text-sm font-bold tracking-[3px] text-[#957e4e] uppercase">{code}</p>}
                <h1 className="mt-3 mb-0 text-[28px] leading-9 font-bold text-[#1a1a1a] min-[981px]:text-[34px] min-[981px]:leading-11">{title}</h1>
                <p className="mx-auto mt-4 mb-0 max-w-110 text-base leading-6 text-[#555]">{message}</p>
                {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
            </div>
        </main>
    )
}

export const statusButton = "inline-flex h-11 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-[#957e4d] px-7 text-sm font-bold text-white no-underline transition hover:opacity-90"
export const statusLink = "inline-flex h-11 items-center justify-center rounded-[5px] border border-[#957e4d] bg-white px-7 text-sm font-bold text-[#957e4d] no-underline transition hover:bg-[#faf6ec]"
