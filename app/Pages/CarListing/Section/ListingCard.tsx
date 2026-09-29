import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatKm, formatRand, monthlyPayment } from "@/app/lib/cars/format"

// Desktop (≥1039px): photo on the left 46%, details on the right. Below that the photo stacks on top.
export default function ListingCard({ car }: { car: Car }) {

    const href = carHref(car);
    const specs = [["/img/car-detail/cal.svg", String(car.year)], ["/img/car-detail/km.svg", formatKm(car.mileage, " ").toUpperCase()], ["/img/car-detail/tran.svg", car.transmission], ["/img/car-detail/fuel.svg", car.fuel]];
    const imageButton = "absolute right-2.5 z-2 flex h-6.5 items-center gap-1.25 rounded-[5px] px-2.5 text-xs no-underline shadow-[0.67px_5.87px_23px_rgba(0,0,0,0.1)]";

    return (
        <>
            <li className="relative mx-auto mb-5 block max-w-175 bg-white font-sans shadow-[0_3px_6px_rgba(0,0,0,0.16)] min-[1039px]:mb-7.5 min-[1039px]:min-h-69.25 min-[1039px]:max-w-none">
                <div className="relative min-h-70 overflow-hidden bg-[#eee] bg-cover bg-center bg-no-repeat min-[1039px]:absolute min-[1039px]:inset-y-0 min-[1039px]:left-0 min-[1039px]:w-[46%]" style={{ backgroundImage: `url(${car.image})` }}>
                    <Link href={href} aria-label={car.title} className="absolute inset-0"></Link>
                    <span className="pointer-events-none absolute bottom-3.25 left-2.5 flex h-6.5 items-center gap-1.5 rounded-[5px] bg-white px-1.5 text-base text-ink">
                        <svg width="16" height="13" viewBox="0 0 14 12" fill="none" stroke="#1a1a1a" strokeWidth="1.1"><path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" /><circle cx="7" cy="7" r="2.3" /></svg>
                        {car.photoCount}
                    </span>
                    <Link href="/login" className={`${imageButton} top-3 bg-[#ce2127] text-white`}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                        Track price
                    </Link>
                    <Link href="/login" className={`${imageButton} bottom-3.25 bg-white text-ink`}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                        Compare
                    </Link>
                </div>

                <div className="p-2.5 min-[1039px]:ml-auto min-[1039px]:w-[52%] min-[1039px]:pl-2.5">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 min-[1039px]:ml-7">
                        <p className="m-0 text-[29px] leading-9.75 font-black text-gold">{formatRand(car.price, " ")}</p>
                        <Link href={href} className="text-lg leading-9.75 font-black text-gold underline">{formatRand(monthlyPayment(car.price), " ")} pm</Link>
                    </div>
                    <h2 className="mx-0 mt-0 mb-4.25 border-b border-dotted border-[#7c7c7c] pb-3.75 text-lg leading-6 font-medium text-ink min-[1039px]:mr-2.5 min-[1039px]:ml-7">
                        <Link href={href} className="text-ink no-underline hover:text-gold">{car.title}</Link>
                    </h2>
                    <ul className="m-0 mb-3.25 flex list-none flex-wrap gap-x-4 p-0 max-[600px]:gap-x-0 min-[1039px]:ml-7 min-[1039px]:max-[1360px]:gap-x-0">
                        {specs.map(([icon, label]) => (
                            <li key={icon} className="flex items-center gap-1.5 text-sm font-bold text-[#7c7c7c] max-[675px]:text-[15px] max-[600px]:mb-1.25 max-[600px]:w-1/2 min-[1039px]:max-[1360px]:mb-1.25 min-[1039px]:max-[1360px]:w-1/2">
                                <img src={icon} alt="" className="h-3.5 w-auto opacity-70" />
                                {label}
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-start max-[350px]:block min-[1039px]:max-[1230px]:block">
                        <div className="min-w-0 flex-1 min-[1039px]:ml-7">
                            <h4 className="m-0 mb-1 flex items-center gap-1.25 text-base leading-5.5 font-normal text-ink">
                                <span><strong>Dealer</strong> {car.dealer.name}</span>
                                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="#957e4d" strokeWidth="0.9" aria-hidden="true"><circle cx="6" cy="6" r="5.4" /><path d="M6 5.2v3.4" strokeLinecap="round" /><circle cx="6" cy="3.5" r="0.35" fill="#957e4d" /></svg>
                            </h4>
                            <span className="mb-3.25 flex items-center gap-1.5 text-sm leading-4.75 text-[#7c7c7c] max-[675px]:text-base">
                                <svg width="10" height="13" viewBox="0 0 10 13" fill="#7c7c7c"><path d="M5 0a5 5 0 0 0-5 5c0 3.6 5 8 5 8s5-4.4 5-8a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" /></svg>
                                {car.location}
                            </span>
                        </div>
                        <div className="flex shrink-0 justify-end max-[350px]:w-full max-[350px]:justify-start min-[1039px]:max-[1230px]:mb-3 min-[1039px]:max-[1230px]:w-full min-[1039px]:max-[1230px]:justify-start min-[1039px]:max-[1230px]:pl-7">
                            <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className="mt-1.25 mr-2.5 flex h-9.75 w-28.75 items-center justify-center rounded-[5px] bg-[#0a0a0a] text-sm font-medium whitespace-nowrap text-white no-underline hover:bg-[#1c1c1c]">Watch Review</a>
                        </div>
                    </div>
                    <ul className="m-0 flex list-none gap-2.5 p-0">
                        {car.gallery.slice(1, 5).map((photo, index) => (
                            <li key={index} className="w-[calc(25%-7.5px)]">
                                <Link href={href} aria-label={`${car.title} photo ${index + 2}`} className="block h-18.75 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${photo})` }}></Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </li>
        </>
    )
}
