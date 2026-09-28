import { carBrands, exoticBrands, motorbikeBrands } from "../Data/brands"
import BrandCarousel from "./BrandCarousel"
import PopularAreas from "./PopularAreas"

export default function PopularBrands() {
    return (
        <>
            <section className="-mt-px bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto max-w-350 pb-15 max-[901px]:pb-2.5">
                    <BrandCarousel title={<>Popular Car Brands and <strong>Models</strong></>} brands={carBrands} banner="/img/popular/cars.png" dots viewAll="https://www.changecars.co.za/our-car-brands" />
                    <BrandCarousel title={<>Popular Motorbike Brands and <strong>Models</strong></>} brands={motorbikeBrands} banner="/img/popular/motorbikes.png" />
                    <BrandCarousel title={<>Popular Exotic Car Brands and <strong>Models</strong></>} brands={exoticBrands} banner="/img/popular/exotic.png" dots viewAll="https://www.changecars.co.za/exotics" />
                    <PopularAreas />
                </div>
            </section>
        </>
    )
}
