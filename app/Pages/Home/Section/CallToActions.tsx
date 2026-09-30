import SectionTitle from "../../../components/SectionTitle"
import { ctas } from "../Data/blocks"
import CtaCard from "./CtaCard"
import CtaSlider from "./CtaSlider"

export default function CallToActions() {
    return (
        <>
            <section className="bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto max-w-350 pt-0 pb-17.5 max-[901px]:pb-0">
                    <div className="text-center">
                        <SectionTitle>Let us make it simple for <strong>you!</strong></SectionTitle>
                    </div>
                    <div className="mt-12.5 -mr-2.5 flow-root max-[948px]:hidden">
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
