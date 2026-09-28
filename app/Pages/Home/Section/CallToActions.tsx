import SectionTitle from "../../../components/SectionTitle"
import { ctas } from "../Data/blocks"
import CtaCard from "./CtaCard"
import CtaSlider from "./CtaSlider"

export default function CallToActions() {
    return (
        <>
            <section className="-mt-5.25 bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto w-[calc(100%+10px)] max-w-350 px-0! pt-0 pb-25 max-[1501px]:px-5! max-[401px]:px-0! max-[901px]:pt-3.75 max-[901px]:pb-8.75">
                    <div className="text-center">
                        <SectionTitle>Let us make it simple for <strong>you!</strong></SectionTitle>
                    </div>
                    <div className="mt-12.5 flow-root max-[948px]:hidden">
                        {ctas.map((cta) => (
                            <CtaCard key={cta.title} cta={cta} />
                        ))}
                    </div>
                    <CtaSlider />
                </div>
            </section>
        </>
    )
}
