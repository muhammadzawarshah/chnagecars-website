import { ReactNode } from "react"

export default function AuthPopup({ open, children }: { open: boolean, children: ReactNode }) {
    return (
        <div className={`fixed left-0 z-200 flex h-full w-full items-center justify-center overflow-y-auto bg-black/64 transition-all duration-300 ${open ? "top-0 opacity-100" : "-top-[200%] opacity-0"}`}>
            <div className="flow-root max-h-202.25 w-full max-w-275 overflow-hidden rounded-xl bg-gold">
                <div className="relative float-left inline h-full min-h-177 w-2/5 bg-[url(/img/login-bg.jpg)] bg-cover bg-position-[left_center] bg-no-repeat before:absolute before:top-0 before:right-0 before:z-3 before:block before:border-r-55 before:border-b-600 before:border-r-gold/60 before:border-b-transparent before:content-[''] after:absolute after:right-0 after:bottom-0 after:z-3 after:block after:border-t-600 after:border-r-55 after:border-t-transparent after:border-r-gold/60 after:content-[''] max-[841px]:float-none max-[841px]:block max-[841px]:min-h-37.5 max-[841px]:w-full max-[841px]:before:hidden max-[841px]:after:border-t-0 max-[841px]:after:border-r-0 max-[841px]:after:border-b-55 max-[841px]:after:border-l-600 max-[841px]:after:border-b-gold/60 max-[841px]:after:border-l-transparent">
                    <div className="absolute z-5 h-full w-full bg-linear-to-b from-black/40 to-black opacity-60"></div>
                    <div className="absolute bottom-40 left-1/2 z-10 flex w-[calc(100%-40px)] -translate-x-1/2 justify-center gap-5 px-2.5 max-[841px]:bottom-20 max-[841px]:max-w-115">
                        <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                        <span className="block h-12.5 w-0.5 shrink-0 bg-gold"></span>
                        <img src="/img/logo.svg" alt="Concierge Service logo" className="relative h-auto w-[calc(50%-20px)] object-contain" />
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
