"use client"

import { useState } from "react"
import Link from "next/link"
import { allCars, carSlug, formatRand, ListedCar, monthlyPayment, priceValue } from "../Home/Data/cars"
import SpecAccordion from "./Section/SpecAccordion"
import FinanceSheet from "./Section/FinanceSheet"
import RelatedCars from "./Section/RelatedCars"
import ContactBar from "./Section/ContactBar"

export default function CarDetail({ car }: { car: ListedCar }) {

    const [finance, setFinance] = useState(false);
    const [shared, setShared] = useState(false);

    const [bodyType, fuel, transmission, engine, mileage] = car.specs;
    const year = car.title.slice(0, 4);
    const price = priceValue(car);
    const others = allCars.filter((item) => carSlug(item) !== carSlug(car));

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

    const gold = "flex h-9.5 flex-1 items-center justify-center rounded-md bg-gold px-1 text-center text-xs font-medium text-white no-underline min-[981px]:h-12 min-[981px]:text-base";
    const outline = "flex h-8.5 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-[#9e9e9e] bg-white text-[11.5px] font-medium text-[#222] no-underline min-[981px]:h-11 min-[981px]:text-[15px]";
    const heading = "m-0 text-center text-lg font-normal text-gold uppercase min-[981px]:text-[32px] [&_strong]:font-bold";

    return (
        <>
            <main className="bg-[#f8fafd] pb-18 font-roboto min-[981px]:pb-15">
                <div className="mx-auto w-full max-w-300 min-[981px]:px-7.5">
                    <div className="sticky top-14 z-40 flex h-14 items-center gap-3 bg-white px-3 min-[981px]:hidden">
                        <Link href="/" aria-label="Back" className="flex size-7 shrink-0 items-center justify-center">
                            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 7.5H2M7.5 1.5l-6 6 6 6" />
                            </svg>
                        </Link>
                        <h1 className="m-0 min-w-0 flex-1 truncate text-base font-medium text-[#111]">{car.title}</h1>
                        <button type="button" onClick={share} aria-label="Share" className="flex size-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                            <svg width="16" height="17" viewBox="0 0 16 17" fill="#222">
                                <circle cx="13" cy="3" r="2.6" /><circle cx="3" cy="8.5" r="2.6" /><circle cx="13" cy="14" r="2.6" />
                                <path d="M3 8.5l10-5.5M3 8.5l10 5.5" stroke="#222" strokeWidth="1.3" />
                            </svg>
                        </button>
                    </div>
                    {shared && <p className="fixed top-30 left-1/2 z-50 m-0 -translate-x-1/2 rounded bg-black/80 px-3 py-1.5 text-xs text-white">Link copied</p>}

                    <div className="bg-white px-3 pt-2 pb-4 min-[981px]:mt-10 min-[981px]:grid min-[981px]:grid-cols-[1.25fr_1fr] min-[981px]:gap-10 min-[981px]:rounded-xl min-[981px]:p-7.5">
                        <div className="relative overflow-hidden rounded-xl">
                            <img src={car.image} alt={car.title} className="block aspect-[675/359] w-full object-cover" />
                            <span className="absolute top-2.5 right-2.5 flex h-6.5 items-center gap-1 rounded-md bg-white px-2 text-[13px] font-bold text-black">
                                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="#000" strokeWidth="1.2"><path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" /><circle cx="7" cy="7" r="2.3" /></svg>
                                {car.photos}
                            </span>
                        </div>

                        <div>
                            <div className="mt-4 flex gap-1.5 min-[981px]:mt-0 min-[981px]:gap-2.5">
                                <a href="https://screan.co.za/" target="_blank" className={gold}>Scream It</a>
                                <a href="https://www.changecars.co.za/insurance/discovery-car-insurance" target="_blank" className={gold}>Insurance</a>
                                <button type="button" onClick={() => setFinance(true)} className={`${gold} cursor-pointer border-0`}>Finance</button>
                                <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className={gold}>Watch Review</a>
                            </div>
                            <h2 className="mt-3.5 mb-0 text-[14.5px] leading-5 font-medium text-[#111] min-[981px]:mt-6 min-[981px]:text-[26px] min-[981px]:leading-8">{car.title}</h2>
                            <p className="mt-1.5 mb-0 flex items-baseline gap-2 min-[981px]:mt-3">
                                <span className="text-lg font-bold text-gold min-[981px]:text-[30px]">{car.price}</span>
                                <button type="button" onClick={() => setFinance(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[11px] text-gold underline min-[981px]:text-sm">{formatRand(monthlyPayment(price))} pm</button>
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-[#757575] min-[981px]:mt-5 min-[981px]:gap-x-5 min-[981px]:text-base">
                                {[["/img/car-detail/cal.svg", year], ["/img/car-detail/km.svg", mileage], ["/img/car-detail/tran.svg", transmission], ["/img/car-detail/fuel.svg", fuel]].map(([icon, label]) => (
                                    <span key={icon} className="flex items-center gap-1.5">
                                        <img src={icon} alt="" className="h-3.5 w-auto opacity-60 min-[981px]:h-4.5" />
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-3 mb-0 text-[13px] text-[#111] min-[981px]:mt-5 min-[981px]:text-base"><strong>Dealer:</strong> {car.dealer}</p>
                            <p className="mt-1.5 mb-0 flex items-center gap-1.5 text-xs text-[#111] min-[981px]:text-[15px]">
                                <svg width="11" height="14" viewBox="0 0 10 13" fill="none" stroke="#957e4e" strokeWidth="1.3"><path d="M5 12s4-4.3 4-7.2A4 4 0 0 0 1 4.8C1 7.7 5 12 5 12z" /><circle cx="5" cy="4.8" r="1.4" /></svg>
                                {car.location}
                            </p>
                            <div className="mt-3.5 flex gap-2 min-[981px]:mt-6 min-[981px]:gap-3">
                                {["Compare", "Favourite", "Track Price"].map((label) => (
                                    <Link key={label} href="/login" className={outline}>+ {label}</Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <section className="border-t border-dashed border-[#cfcfcf] bg-white pt-6 min-[981px]:mt-8 min-[981px]:rounded-xl min-[981px]:border-0 min-[981px]:pt-10">
                        <h2 className={heading}>Technical <strong>Specifications</strong></h2>
                        <div className="mt-4 min-[981px]:mt-7">
                            <SpecAccordion icon="/img/car-detail/general.svg" title="General" rows={[["Body Type", bodyType], ["Year", year], ["Mileage", mileage]]} />
                            <SpecAccordion icon="/img/car-detail/engine.svg" title="Engine" rows={[["Engine Size", engine], ["Fuel Type", fuel]]} />
                            <SpecAccordion icon="/img/car-detail/handling.svg" title="Handling" rows={[["Transmission", transmission]]} />
                            <SpecAccordion icon="/img/car-detail/calculator.svg" title="Finance Calculator" onOpen={() => setFinance(true)} />
                        </div>
                        <p className="m-0 px-3 py-3 text-[13px] leading-4.5 text-[#111] min-[981px]:px-5 min-[981px]:py-5 min-[981px]:text-base min-[981px]:leading-6"><strong>KINDLY NOTE:</strong> The data provided for this vehicle is supplied by the selling party. CHANGECARS is not responsible for any errors should they occur.</p>
                    </section>

                    <section className="border-t border-dashed border-[#cfcfcf] px-3 pt-6 pb-5 min-[981px]:px-0 min-[981px]:pt-10 min-[981px]:pb-8">
                        <h2 className={heading}>Additional <strong>Information</strong></h2>
                        <p className="mt-3 mb-0 text-[13px] leading-4.5 text-[#111] min-[981px]:mt-5 min-[981px]:text-center min-[981px]:text-base">Any additional information provided by the dealer about this vehicle will appear here.</p>
                    </section>

                    <section className="border-t border-dashed border-[#cfcfcf] px-3 pt-6 pb-6 min-[981px]:px-0 min-[981px]:pt-10 min-[981px]:pb-10">
                        <h2 className={heading}>Dealer <strong>Location</strong></h2>
                        <iframe
                            title="Dealer location"
                            src="https://maps.google.com/maps?q=Johannesburg%2C%20South%20Africa&z=12&output=embed"
                            loading="lazy"
                            className="mt-4 block h-50 w-full rounded-xl border-0 min-[981px]:mt-7 min-[981px]:h-100"
                        ></iframe>
                    </section>

                    <div className="px-3 min-[981px]:px-0">
                        <RelatedCars title={<>More from this <strong>Dealer</strong></>} cars={others.slice(0, 6)} />
                        <RelatedCars title={<>You might like <strong>this</strong></>} cars={others.filter((item) => item.specs[0] === bodyType).concat(others.filter((item) => item.specs[0] !== bodyType)).slice(0, 6)} />
                    </div>

                    <ContactBar title={car.title} />
                </div>
            </main>
            {finance && <FinanceSheet key={carSlug(car)} price={price} onClose={() => setFinance(false)} />}
        </>
    )
}
