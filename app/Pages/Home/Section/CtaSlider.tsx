"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { ctas } from "../Data/blocks"
import CtaSlideCard from "./CtaSlideCard"

export default function CtaSlider() {
    return (
        <>
            <div className="mt-7.5 hidden max-[948px]:block">
                <SwipeSlider items={ctas} itemKey={(cta) => cta.title} renderItem={(cta) => <CtaSlideCard cta={cta} />} />
            </div>
        </>
    )
}
