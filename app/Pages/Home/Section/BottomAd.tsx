import AdBanner from "../../../components/AdBanner"
import { bottomAd } from "../Data/ads"

export default function BottomAd() {
    return (
        <>
            <section className="-mt-px bg-white px-11.25">
                <div className="pb-20 max-[901px]:pb-12.5">
                    <AdBanner ad={bottomAd} className="mx-auto block w-full max-w-199" />
                </div>
            </section>
        </>
    )
}
