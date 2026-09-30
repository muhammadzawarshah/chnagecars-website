import { carBrands, exoticBrands, motorbikeBrands } from "../Data/brands"
import BrandCarousel from "./BrandCarousel"
import { carSearchHref } from "@/app/lib/cars/search"

export default function PopularBrands() {
    return (
        <>
            <section className="-mt-px bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto max-w-350">
                    <BrandCarousel title={<>Popular Car Brands and <strong>Models</strong></>} brands={carBrands} banner="/img/popular/cars.png" dots viewAll="https://www.changecars.co.za/our-car-brands" />
                    <BrandCarousel title={<>Popular Exotic Car Brands and <strong>Models</strong></>} brands={exoticBrands} banner="/img/popular/exotic.png" dots viewAll={carSearchHref({ collection: "exotics" })} />
                    <BrandCarousel title={<>Popular Motorbike Brands and <strong>Models</strong></>} brands={motorbikeBrands} banner="/img/popular/motorbikes.png" dots viewAll={carSearchHref({ bodyType: "Motorbike" })} />
                </div>
            </section>
        </>
    )
}
