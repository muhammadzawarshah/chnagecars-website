"use client"

import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { provinces } from "../Data/brands"
import ProvinceCard from "./ProvinceCard"

export default function PopularAreas() {
    return (
        <>
            <div className="mb-0 max-[901px]:mb-6.25 max-[681px]:mb-3.75">
                <SectionTitle className="max-[951px]:mb-13.75 max-[681px]:mb-17.5">Popular Cars in your <strong>Area</strong></SectionTitle>

                <ul className="m-0 flow-root w-full list-none p-2.5 max-[681px]:hidden">
                    {provinces.map((province) => (
                        <li key={province.name} className="float-left mr-5 mb-3.75 block w-[calc(33.3333%-13.333px)] rounded-[10px] p-0 shadow-[0px_5px_12px_0px_rgba(0,0,0,0.149)] nth-[3n]:mr-0">
                            <ProvinceCard province={province} />
                        </li>
                    ))}
                </ul>

                <div className="hidden max-[681px]:block">
                    <Carousel
                        items={provinces}
                        perView={1}
                        breakpoints={[]}
                        gap={40}
                        prevClass="-top-9 right-16.25"
                        nextClass="-top-9 right-3.75"
                        listClass="min-h-77.5 py-2.5"
                        itemClass="relative left-3.75"
                        renderItem={(province, _index, visible) => (
                            <div className={`rounded-[10px] ${visible ? "shadow-[0px_5px_12px_0px_rgba(0,0,0,0.149)]" : ""}`}>
                                <ProvinceCard province={province} large />
                            </div>
                        )}
                    />
                </div>
            </div>
        </>
    )
}
