import Link from "next/link"
import { Special } from "../Home/Data/blocks"
import SpecialForm from "./Section/SpecialForm"

// Copies the live /specials/single page: offer card on the left (or top), enquiry form on the right (or below).
export default function SpecialDetail({ special }: { special: Special }) {
    return (
        <>
            <main className="relative -mt-27 bg-[#1a1b1b] bg-[linear-gradient(rgba(26,26,26,0.5),rgba(26,26,26,0.5)),url(/img/specials/specials-background.jpg)] bg-cover bg-fixed bg-top bg-no-repeat px-5 pt-27 font-sans max-[1111px]:mt-0 max-[1111px]:pt-0 max-[981px]:-mt-14">
                <div className="relative mx-auto max-w-350 pt-12.5 pb-25">
                    <Link href="/#specials" className="absolute top-23 left-2.5 z-1 text-base leading-[18.4px] text-white no-underline min-[1301px]:top-12.5">&lt; Return to <span className="text-gold">Specials</span></Link>
                    <section className="pt-22.5 max-[801px]:pt-17 min-[1301px]:mt-7 min-[1301px]:pt-0 min-[1366px]:flex">
                        <div className="min-h-213.25 min-w-0 rounded-t-[10px] bg-white px-15.5 py-13.75 max-[801px]:min-h-150 max-[801px]:px-5 max-[801px]:py-11.25 max-[536px]:min-h-0 min-[1366px]:flex-1 min-[1366px]:rounded-t-none min-[1366px]:rounded-l-[10px]">
                            <h1 className="m-0 line-clamp-2 text-[38px] leading-13 font-black text-gold uppercase max-[801px]:text-[32px] max-[801px]:leading-10">{special.title} SPECIAL</h1>
                            <p className="my-3.25 text-lg leading-5.75 text-[#2f2f2f]">{special.text}</p>
                            <div role="img" aria-label={special.title} className="h-147.25 bg-contain bg-center bg-no-repeat max-[801px]:h-100 max-[536px]:h-75" style={{ backgroundImage: `url(${special.image})` }}></div>
                        </div>
                        <div className="min-h-213.25 rounded-b-[10px] bg-[url(/img/specials/contact_us_form_bg.png)] bg-cover bg-center bg-no-repeat px-15 pt-22.5 pb-13.5 max-[801px]:min-h-0 max-[801px]:px-5 max-[801px]:py-11.25 min-[1366px]:w-150 min-[1366px]:shrink-0 min-[1366px]:rounded-b-none min-[1366px]:rounded-r-[10px]">
                            <SpecialForm />
                        </div>
                    </section>
                </div>
            </main>
        </>
    )
}
