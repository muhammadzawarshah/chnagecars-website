"use client"

import { ReactNode, useRef, useState } from "react"
import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { featuredCarHref, formatKm, formatRand, monthlyPayment } from "@/app/lib/cars/format"
import CompareButton from "../../../components/Compare/CompareButton"
import { BodyIcon, EngineIcon, FuelIcon, GearboxIcon, InfoIcon, MileageIcon, PinIcon, YearIcon } from "./SpecIcons"

function Spec({ icon, children, last = false }: { icon: ReactNode, children: ReactNode, last?: boolean }) {
    return (
        <span className="flex min-w-0 items-center">
            <span className="flex min-w-0 items-center gap-1.5">{icon}<span className="truncate">{children}</span></span>
            {!last && <span className="mx-2.5 text-[#cfcfcf]">|</span>}
        </span>
    )
}

const action = "flex h-6 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border! border-[#957e4e] bg-white font-roboto! text-[9.5px] font-bold text-[#111] no-underline";

// Result card from the app's search screen.
export default function ResultCard({ car }: { car: Car }) {

    const trackRef = useRef<HTMLDivElement>(null);
    const [slide, setSlide] = useState(0);
    const photos = (car.gallery.length ? car.gallery : [car.image]).slice(0, 5);
    const href = featuredCarHref(car);

    return (
        <>
            <article className="overflow-hidden rounded-[11px] border border-[#957e4e] bg-white font-roboto">
                <div className="relative aspect-[1.48] w-full bg-[#eee]">
                    <div ref={trackRef} onScroll={(event) => setSlide(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))} className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto">
                        {photos.map((photo, index) => (
                            <Link key={photo + index} href={href} className="block h-full w-full shrink-0 snap-start bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${photo})` }} aria-label={car.title}></Link>
                        ))}
                    </div>
                    {car.featured && <span className="pointer-events-none absolute top-2.5 left-2 flex h-7.25 items-center rounded-[4px] bg-[#957e4e] px-3 text-xs text-white">Featured</span>}
                    <span className="pointer-events-none absolute bottom-2 left-2 flex h-5.5 items-center gap-1 rounded-[4px] bg-white px-1.5 text-[11px] font-bold text-black">
                        <svg width="13" height="11" viewBox="0 0 14 12" fill="none" stroke="#000" strokeWidth="1.2">
                            <path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" />
                            <circle cx="7" cy="7" r="2.3" />
                        </svg>
                        {car.photoCount}
                    </span>
                    {photos.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.75">
                            {photos.map((photo, index) => (
                                <button key={photo + index} type="button" aria-label={`Photo ${index + 1}`} onClick={() => trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth, behavior: "smooth" })} className={`size-2 cursor-pointer rounded-full border-0 p-0 ${index === slide ? "bg-white" : "bg-white/50"}`}></button>
                            ))}
                        </div>
                    )}
                    <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className="absolute right-2 bottom-2 flex h-5.5 items-center rounded-[5px] bg-white px-2 text-[11px] font-bold text-black no-underline">Watch Review</a>
                </div>

                <Link href={href} className="block bg-[#e8e4e1] px-2 pt-2.5 pb-2 no-underline">
                    <h3 className="m-0 truncate text-[15.5px] leading-5 font-medium text-[#111]">{car.title}</h3>
                    <p className="mt-1.5 mb-0 flex items-baseline gap-2.5">
                        <span className="text-xl leading-6 font-bold text-[#957e4e]">{formatRand(car.price)}</span>
                        <span className="text-[10.5px] font-semibold text-[#957e4e] underline">{formatRand(monthlyPayment(car.price), " ")} pm</span>
                    </p>
                </Link>

                <div className="flex flex-col gap-3.5 bg-white px-2 py-3 text-[12.5px] leading-4 text-[#a3a3a3]">
                    <div className="flex overflow-hidden whitespace-nowrap">
                        <Spec icon={<YearIcon />}>{car.year}</Spec>
                        <Spec icon={<MileageIcon />}>{formatKm(car.mileage)}</Spec>
                        <Spec icon={<FuelIcon />} last>{car.fuel}</Spec>
                    </div>
                    <div className="flex overflow-hidden whitespace-nowrap">
                        <Spec icon={<GearboxIcon />}>{car.transmission}</Spec>
                        <Spec icon={<BodyIcon />}>{car.bodyType}</Spec>
                        <Spec icon={<EngineIcon />} last>{car.engine}</Spec>
                    </div>
                </div>

                <div className="bg-[#e8e4e1] px-3 pt-3.5 pb-3 text-[12.5px] leading-4 text-[#222]">
                    <p className="m-0 flex items-center gap-1.5"><span><strong>Dealer:</strong> {car.dealer.name}</span><InfoIcon /></p>
                    <p className="mt-3 mb-0 flex items-center gap-2"><PinIcon />{car.location}</p>
                </div>

                <div className="flex gap-1.25 bg-[#cec9b5] px-2 py-3">
                    <CompareButton car={{ id: car.id, title: car.title, price: car.price, image: car.image, href }} className={action}><span className="text-sm font-normal text-[#957e4e]">+</span> Compare</CompareButton>
                    <Link href="/login" className={action}><span className="text-sm font-normal text-[#957e4e]">+</span> Favourite</Link>
                    <Link href="/login" className={action}><span className="text-sm font-normal text-[#957e4e]">+</span> Track Price</Link>
                </div>
            </article>
        </>
    )
}
