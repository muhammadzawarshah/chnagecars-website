import { ReactNode } from "react"

// Pieces shared by the pages copied from the app's form screens (Contact, Newsletter).

export const fieldBox = "w-full rounded-[5px] border border-[#e0e0e0] bg-[#f5f5f5] px-3 font-sans text-[13.5px] outline-none transition-colors focus:border-[#957e4e] min-[981px]:text-base";

export function FieldLabel({ children }: { children: ReactNode }) {
    return <label className="mb-0.5 block text-[11.5px] leading-3.5 font-medium text-[#212121] min-[981px]:mb-2 min-[981px]:text-sm min-[981px]:leading-4.5">{children} <span className="text-[#ff4d4d]">*</span></label>
}

export function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 mb-0 font-sans text-xs text-[#ff4d4d]">{message}</p> : null
}

export function SelectChevron() {
    return (
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="#957e4e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2">
            <path d="M1.5 1.75 6 6.25l4.5-4.5" />
        </svg>
    )
}

// The app banners have pure black edges, so on wide screens they sit centred on a full-width black band.
export function AppBanner({ src, alt }: { src: string, alt: string }) {
    return (
        <div className="bg-black">
            <img src={src} alt={alt} className="mx-auto block aspect-video w-full object-cover min-[981px]:h-140 min-[981px]:w-auto min-[981px]:max-w-full" />
        </div>
    )
}
