"use client"

import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { specials } from "../Data/blocks"

export default function Specials() {
    return (
        <>
            <section className="m-0 -mt-px overflow-hidden bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5 pb-25 max-[901px]:pb-13.75">
                <SectionTitle className="font-black! max-[1000px]:mb-6.25">Specials</SectionTitle>
                <p className="mt-4 mb-22.5 text-center text-base leading-6.5 font-normal max-[801px]:mb-17.5 max-[768px]:text-lg">
                    As a Customer you are special to us! Here are our specials for you!
                </p>
                <div className="mx-auto max-w-350">
                    <Carousel
                        items={specials}
                        arrows={false}
                        dots
                        renderItem={(item) => (
                            <a href={item.href} className="block cursor-pointer no-underline">
                                <div className="aspect-[342.5/337] h-auto w-full rounded-t-[10px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.image})` }}></div>
                                <h4 className="m-0 line-clamp-1 block h-8.75 overflow-hidden rounded-b-[10px] bg-gold px-2.5 text-center leading-8.75 font-bold text-ellipsis text-white uppercase">{item.title}</h4>
                            </a>
                        )}
                    />
                    <a href="https://www.changecars.co.za/specials" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
                </div>
            </section>
        </>
    )
}
