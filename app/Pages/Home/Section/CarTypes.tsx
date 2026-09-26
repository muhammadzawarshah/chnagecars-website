"use client"

import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import useWindowWidth from "../../../components/useWindowWidth"
import { carTypes } from "../Data/blocks"
import CarTypeCard from "./CarTypeCard"

function isDark(index: number, columns: number) {
    return (Math.floor(index / columns) + (index % columns)) % 2 === 0;
}

export default function CarTypes() {

    const width = useWindowWidth();
    const columns = width >= 1469 ? 4 : width >= 1108 ? 3 : 2;

    return (
        <>
            <section className="-mt-px flex min-h-screen flex-col items-center justify-center bg-white px-8.75 pt-25 pb-17.5 max-[901px]:pt-11.25 max-[901px]:pb-13.75 max-[747px]:min-h-0">
                <div>
                    <SectionTitle>Our types of <strong>Cars</strong></SectionTitle>
                    <p className="mx-auto mt-0 mb-7.5 w-[80%] max-w-175 text-center text-base leading-6.5 font-normal whitespace-normal text-coal max-[768px]:px-5 max-[768px]:text-lg max-[747px]:mb-17.5">
                        From Alfa Romeo to Volvo and every Manufacturer in between you will find them on our site. Whether you are looking for an entry level vehicle or the absolute top of the range, the site will cater for all your needs
                    </p>
                </div>

                <ul className="mx-auto mt-17.5 mb-17.5 flex w-full max-w-350 list-none flex-wrap items-center justify-center gap-x-11.25 gap-y-13.75 p-0 max-[901px]:mt-10 max-[747px]:hidden">
                    {carTypes.map((carType, index) => (
                        <li key={carType.title} className="w-full max-w-79 rounded-[10px] shadow-[5px_5px_15px_0px_rgba(0,0,0,0.149)]">
                            <CarTypeCard carType={carType} dark={isDark(index, columns)} />
                        </li>
                    ))}
                </ul>

                <div className="hidden w-full max-[747px]:block">
                    <Carousel
                        items={carTypes}
                        perView={1}
                        breakpoints={[]}
                        gap={30}
                        prevClass="-top-9 right-15"
                        nextClass="-top-9 right-2.5"
                        listClass="min-h-100 pt-2.5"
                        itemClass="relative left-2.5 text-center"
                        renderItem={(carType, index, visible) => (
                            <div className={visible ? "rounded-[10px] shadow-[5px_5px_15px_0px_rgba(0,0,0,0.149)]" : ""}>
                                <CarTypeCard carType={carType} dark={index % 2 === 0} />
                            </div>
                        )}
                    />
                </div>

                <div>
                    <a href="https://www.changecars.co.za/" className="mr-1.5 block h-9.5 w-44.25 cursor-pointer rounded-[5px] border border-[#262626] bg-[#262626] bg-[url(/img/magnifying-glass-white.svg)] bg-size-[15px] bg-position-[left_22px_top_10px] bg-no-repeat pr-4 pl-11.5 text-base leading-8.5 font-normal text-white no-underline transition-colors duration-300 ease-out hover:border-ink hover:bg-ink max-[768px]:w-46 max-[768px]:text-lg">
                        Vehicle search
                    </a>
                </div>
            </section>
        </>
    )
}
