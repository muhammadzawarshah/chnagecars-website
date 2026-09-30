import AdBanner from "../../../components/AdBanner"
import { bottomAd } from "../Data/ads"

export default function BottomAd() {
    return (
        <>
            <section className="-mt-px bg-white px-11.25 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="pb-12.5 max-[901px]:pb-0 max-[527px]:pb-6.25">
                    <AdBanner ad={bottomAd} className="mx-auto block w-full max-w-199" />
                </div>
            </section>
        </>
    )
}
