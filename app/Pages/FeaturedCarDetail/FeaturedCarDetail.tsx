"use client"

import { useState } from "react"
import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { formatKm, formatRand, monthlyPayment } from "@/app/lib/cars/format"
import SpecAccordion from "./Section/SpecAccordion"
import FinanceSheet from "./Section/FinanceSheet"
import RelatedCars from "./Section/RelatedCars"
import ContactBar from "./Section/ContactBar"
import CarGallery from "./Section/CarGallery"

type CarDetailProps = {
    car: Car
    dealerCars: Car[]
    similarCars: Car[]
}

export default function FeaturedCarDetail({ car, dealerCars, similarCars }: CarDetailProps) {

    const [finance, setFinance] = useState(false);
    const [shared, setShared] = useState(false);

    const { bodyType, fuel, transmission, engine, price } = car;
    const year = String(car.year);
    const mileage = formatKm(car.mileage);

    async function share() {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: car.title, url }).catch(() => undefined);
            return;
        }
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
    }

    const gold = "flex h-6.5 flex-1 items-center justify-center rounded-md bg-gold px-1 text-center text-[9.5px] font-medium text-white no-underline min-[981px]:h-12 min-[981px]:text-base";
    const outline = "flex h-6.5 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-gold bg-white text-[10px] font-medium text-[#222] no-underline min-[981px]:h-11 min-[981px]:text-[15px]";
    const heading = "m-0 text-center text-lg font-normal text-gold uppercase min-[981px]:text-[32px] [&_strong]:font-bold";
    const dashed = "border-dashed border-[#bdbdbd] min-[981px]:border-[#cfcfcf]";

    return (
        <>
            <main className="bg-[#f8fafd] pb-18 font-roboto max-[981px]:-mt-14 min-[981px]:pb-15">
                <div className="mx-auto w-full max-w-300 min-[981px]:px-7.5">
                    <div className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-white px-4 min-[981px]:hidden">
                        <Link href="/" aria-label="Back" className="flex size-7 shrink-0 items-center justify-center">
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 7.5H2M7.5 1.5l-6 6 6 6" />
                            </svg>
                        </Link>
                        <h1 className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#111]">{car.title}</h1>
                        <button type="button" onClick={share} aria-label="Share" className="flex size-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="#957e4e">
                                <circle cx="13" cy="3" r="2.6" /><circle cx="3" cy="8.5" r="2.6" /><circle cx="13" cy="14" r="2.6" />
                                <path d="M3 8.5l10-5.5M3 8.5l10 5.5" stroke="#957e4e" strokeWidth="1.3" />
                            </svg>
                        </button>
                    </div>
                    {shared && <p className="fixed top-16 left-1/2 z-50 m-0 -translate-x-1/2 rounded bg-black/80 px-3 py-1.5 text-xs text-white">Link copied</p>}

                    <div className="px-4 pt-3.5 pb-6.5 min-[981px]:mt-10 min-[981px]:grid min-[981px]:grid-cols-[1.25fr_1fr] min-[981px]:gap-10 min-[981px]:rounded-xl min-[981px]:bg-white min-[981px]:p-7.5">
                        <CarGallery photos={car.gallery} title={car.title} />

                        <div className="px-1 min-[981px]:px-0">
                            <div className="mt-9 flex gap-1.5 min-[981px]:mt-0 min-[981px]:gap-2.5">
                                <a href="https://screan.co.za/" target="_blank" className={gold}>Screan It</a>
                                <a href="https://www.changecars.co.za/insurance/discovery-car-insurance" target="_blank" className={gold}>Insurance</a>
                                <button type="button" onClick={() => setFinance(true)} className={`${gold} cursor-pointer border-0`}>Finance</button>
                                <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className={gold}>Watch Review</a>
                            </div>
                            <h2 className="mt-2.5 mb-0 text-base leading-5 font-medium tracking-[0.2px] text-[#111] min-[981px]:mt-6 min-[981px]:text-[26px] min-[981px]:leading-8">{car.title}</h2>
                            <p className="mt-2 mb-0 flex items-baseline gap-2.5 min-[981px]:mt-3">
                                <span className="text-xl font-bold text-gold min-[981px]:text-[30px]">{formatRand(price)}</span>
                                <button type="button" onClick={() => setFinance(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[11.5px] font-semibold text-gold underline min-[981px]:text-sm">{formatRand(monthlyPayment(price))} pm</button>
                            </p>
                            <div className="mt-3.5 flex items-center justify-between text-[11.5px] text-[#9e9e9e] min-[981px]:mt-5 min-[981px]:text-base">
                                {[["/img/car-detail/cal.svg", year], ["/img/car-detail/km.svg", mileage], ["/img/car-detail/tran.svg", transmission], ["/img/car-detail/fuel.svg", fuel]].map(([icon, label], index) => (
                                    <span key={icon} className="flex items-center gap-1.5">
                                        {index > 0 && <span className="mr-1.5 h-3 w-px bg-[#bdbdbd] min-[981px]:mr-2.5 min-[981px]:h-4"></span>}
                                        <img src={icon} alt="" className="h-3.5 w-auto opacity-50 min-[981px]:h-4.5" />
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-3 mb-0 flex items-center gap-1.5 text-[13.5px] text-[#111] min-[981px]:mt-5 min-[981px]:text-base">
                                <span><strong>Dealer:</strong> {car.dealer.name}</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#957e4e" strokeWidth="1.1" aria-hidden="true">
                                    <circle cx="6" cy="6" r="5.4" /><path d="M6 5.2v3.4" strokeLinecap="round" /><circle cx="6" cy="3.5" r="0.3" fill="#957e4e" />
                                </svg>
                            </p>
                            <p className="mt-2.5 mb-0 flex items-center gap-2 text-[12.5px] text-[#111] min-[981px]:text-[15px]">
                                <svg width="11" height="14" viewBox="0 0 10 13" fill="none" stroke="#957e4e" strokeWidth="1.3"><path d="M5 12s4-4.3 4-7.2A4 4 0 0 0 1 4.8C1 7.7 5 12 5 12z" /><circle cx="5" cy="4.8" r="1.4" /></svg>
                                {car.location}
                            </p>
                            <div className="mt-3 flex gap-1.25 min-[981px]:mt-6 min-[981px]:gap-3">
                                {["Compare", "Favourite", "Track Price"].map((label) => (
                                    <Link key={label} href="/login" className={outline}><span className="text-[#757575]">+</span> {label}</Link>
                                ))}
                            </div>
                            <ContactBar title={car.title} inline />
                        </div>
                    </div>

                    <section className={`${dashed} border-t border-b pt-4.5 max-[981px]:mb-4.5 min-[981px]:mt-8 min-[981px]:rounded-xl min-[981px]:border-0 min-[981px]:bg-white min-[981px]:pt-10`}>
                        <h2 className={heading}>Technical <strong>Specifications</strong></h2>
                        <div className="mt-4 min-[981px]:mt-7">
                            <SpecAccordion icon="/img/car-detail/general.svg" title="General" rows={[["Body Type", bodyType], ["Year", year], ["Mileage", mileage]]} />
                            <SpecAccordion icon="/img/car-detail/engine.svg" title="Engine" rows={[["Engine Size", engine], ["Fuel Type", fuel]]} />
                            <SpecAccordion icon="/img/car-detail/handling.svg" title="Handling" rows={[["Transmission", transmission]]} />
                            <SpecAccordion icon="/img/car-detail/calculator.svg" title="Finance Calculator" onOpen={() => setFinance(true)} />
                        </div>
                        <p className="m-0 bg-white px-5 pt-4 pb-6.5 text-[10.5px] leading-3.5 text-[#111] min-[981px]:py-5 min-[981px]:text-base min-[981px]:leading-6"><strong>KINDLY NOTE:</strong> The data provided for this vehicle is supplied by the selling party. CHANGECARS is not responsible for any errors should they occur.</p>
                    </section>

                    <section className={`${dashed} border-t px-5 pt-5 pb-5 min-[981px]:px-0 min-[981px]:pt-10 min-[981px]:pb-8`}>
                        <h2 className={heading}>Additional <strong>Information</strong></h2>
                        <p className="mt-4 mb-0 text-[10.5px] leading-[14.5px] text-[#111] min-[981px]:mt-5 min-[981px]:text-center min-[981px]:text-base min-[981px]:leading-6">Any additional information provided by the dealer about this vehicle will appear here.</p>
                    </section>

                    <section className={`${dashed} border-t px-5 pt-5 pb-6 min-[981px]:px-0 min-[981px]:pt-10 min-[981px]:pb-10`}>
                        <h2 className={heading}>Dealer <strong>Location</strong></h2>
                        <iframe
                            title="Dealer location"
                            src="https://maps.google.com/maps?q=Johannesburg%2C%20South%20Africa&z=12&output=embed"
                            loading="lazy"
                            className="mt-4 block h-50 w-full rounded-[10px] border-0 min-[981px]:mt-7 min-[981px]:h-100 min-[981px]:rounded-xl"
                        ></iframe>
                    </section>

                    <div className="px-5 min-[981px]:px-0">
                        <RelatedCars title={<>More from this <strong>Dealer</strong></>} cars={dealerCars} />
                        <RelatedCars title={<>You might like <strong>this</strong></>} cars={similarCars} />
                    </div>

                    <ContactBar title={car.title} />
                </div>
            </main>
            {finance && <FinanceSheet key={car.id} price={price} onClose={() => setFinance(false)} />}
        </>
    )
}
