"use client"

import Carousel from "../../../components/Carousel"
import SectionTitle from "../../../components/SectionTitle"
import { testimonials } from "../Data/testimonials"

export default function Testimonials() {
    return (
        <>
            <section className="m-0 overflow-hidden bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5 pt-25 pb-12.5 max-[901px]:pt-7.5 max-[901px]:pb-6.25 max-[601px]:pt-2.5">
                <SectionTitle className="font-bold!">Testimonials</SectionTitle>
                <p className="mt-4 mb-22.5 text-center text-base leading-6.5 font-normal max-[801px]:mb-17.5 max-[768px]:text-lg">
                    Where Satisfaction meets Success
                </p>
                <div className="mx-auto max-w-350">
                    <Carousel
                        items={testimonials}
                        dots
                        arrows={false}
                        innerClass="h-91 max-[901px]:h-82"
                        itemClass="mt-5 h-81.75 rounded-[10px] bg-cloud px-5 max-[301px]:px-3 shadow-[5px_5px_5px_0px_rgba(0,0,0,0.149)] max-[901px]:h-73.75"
                        renderItem={(item) => (
                            <>
                                <h3 className="mt-5 mb-0 max-h-6.25 overflow-hidden text-left text-xl leading-6 font-bold text-slate uppercase wrap-anywhere">{item.name}</h3>
                                <img src="/img/testimonials-five-stars.svg" alt="Five stars" className="mt-3.75 mb-1.25 inline h-5.5 max-w-full align-baseline" />
                                <div>
                                    <p className="m-0 h-52.5 overflow-auto pr-1.75 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#957e4e] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#e2ddd3] text-left text-sm leading-6.5 font-normal whitespace-pre-line text-slate max-[901px]:h-47.5">{item.text}</p>
                                </div>
                            </>
                        )}
                    />
                </div>
                <a href="https://www.changecars.co.za/testimonials" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
            </section>
        </>
    )
}
