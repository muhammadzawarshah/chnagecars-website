import { ReactNode } from "react"

// Shared look for the information and directory pages: the Motoring News car photo behind a
// light heading (gold highlight), then the content on white.
export default function InfoLayout({ title, highlight, intro, actions, children }: { title: string, highlight?: string, intro?: ReactNode, actions?: ReactNode, children: ReactNode }) {
    return (
        <main className="relative isolate bg-white">
            <div aria-hidden="true" className="absolute inset-x-0 -top-27 -z-1 hidden h-110 bg-[url(/img/articles-bg.jpg)] bg-cover bg-center min-[981px]:block min-[1112px]:max-[1281px]:-top-34.5 min-[981px]:max-[1111px]:top-0"></div>
            <div className="mx-auto w-full max-w-350 px-3.75 pt-15 pb-20 max-[980px]:px-0 max-[980px]:pt-0">
                <div className="pb-10 max-[980px]:bg-[url(/img/articles-bg.jpg)] max-[980px]:bg-cover max-[980px]:bg-center max-[980px]:px-3.75 max-[980px]:pt-10 max-[980px]:pb-6">
                    <h1 className="m-0 font-sans text-[52px] leading-[58px] font-light text-white uppercase max-[980px]:text-[40px] max-[980px]:leading-[46px]">{title}{highlight && <> <strong className="font-light text-gold">{highlight}</strong></>}</h1>
                    {intro && <p className="m-0 max-w-183.25 pt-5 font-sans text-xl leading-6 font-bold tracking-[0.02em] text-white max-[980px]:text-base">{intro}</p>}
                    {actions && <div className="pt-6">{actions}</div>}
                </div>
                <div className="mt-15 max-[980px]:mt-6 max-[980px]:px-3.75">{children}</div>
            </div>
        </main>
    )
}
