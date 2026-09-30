"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { ctas } from "../Data/blocks"
import CtaSlideCard from "./CtaSlideCard"

export default function CtaSlider() {
    return (
        <>
            <div className="mt-7.5 -mx-2.5 hidden max-[948px]:block">
                <SwipeSlider items={ctas} itemKey={(cta) => cta.title} slideClass="w-1/2 max-[601px]:w-full" renderItem={(cta) => <CtaSlideCard cta={cta} />} />
            </div>
        </>
    )
}
