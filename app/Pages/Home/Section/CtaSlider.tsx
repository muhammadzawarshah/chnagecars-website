"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { ctas } from "../Data/blocks"
import CtaSlideCard from "./CtaSlideCard"

export default function CtaSlider() {
    return (
        <>
            <div className="mt-7.5 hidden max-[948px]:block">
                <SwipeSlider items={ctas} itemKey={(cta) => cta.title} slideClass="w-1/2 max-[601px]:px-1.5" renderItem={(cta) => <CtaSlideCard cta={cta} />} />
                <a href="https://www.changecars.co.za/concierge-service" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
            </div>
        </>
    )
}
