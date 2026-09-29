import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatKm, formatRand, monthlyPayment } from "@/app/lib/cars/format"
import CompareButton from "../../../components/Compare/CompareButton"

// Desktop (≥1039px): photo on the left 46%, details on the right. Below that the photo stacks on top.
export default function ListingCard({ car }: { car: Car }) {

    const href = carHref(car);
    const specs = [["/img/car-detail/cal.svg", String(car.year)], ["/img/car-detail/km.svg", formatKm(car.mileage, " ").toUpperCase()], ["/img/car-detail/tran.svg", car.transmission], ["/img/car-detail/fuel.svg", car.fuel]];
    const imageButton = "absolute right-2.5 z-2 flex h-6.5 items-center gap-1.25 rounded-[5px] px-2.5 text-xs no-underline shadow-[0.67px_5.87px_23px_rgba(0,0,0,0.1)]";

    return (
        <>
            <li className="relative mx-auto mb-5 block max-w-175 bg-white font-sans shadow-[0_3px_6px_rgba(0,0,0,0.16)] min-[1039px]:mb-7.5 min-[1039px]:max-w-none">
                <div className="relative h-70 overflow-hidden bg-[#eee] bg-cover bg-center bg-no-repeat min-[1039px]:absolute min-[1039px]:inset-y-0 min-[1039px]:left-0 min-[1039px]:h-auto min-[1039px]:w-[46%]" style={{ backgroundImage: `url(${car.image})` }}>
                    <Link href={href} aria-label={car.title} className="absolute inset-0"></Link>
                    <span className="pointer-events-none absolute bottom-3.25 left-2.5 flex h-6.5 items-center gap-1.5 rounded-[5px] bg-white px-1.5 text-base text-ink">
                        <svg width="16" height="13" viewBox="0 0 14 12" fill="none" stroke="#1a1a1a" strokeWidth="1.1"><path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" /><circle cx="7" cy="7" r="2.3" /></svg>
                        {car.photoCount}
                    </span>
                    <Link href="/login" className={`${imageButton} top-3 bg-[#ce2127] text-white`}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                        Track price
                    </Link>
                    <CompareButton car={{ id: car.id, title: car.title, price: car.price, image: car.image, href }} className={`${imageButton} bottom-3.25 bg-white text-ink`}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                        Compare
                    </CompareButton>
                </div>

                <div className="relative bg-white py-2.5 pl-2.5 min-[1039px]:ml-auto min-[1039px]:w-[52%]">
                    <div className="flex h-9.75 items-baseline gap-x-2.5 whitespace-nowrap min-[1039px]:ml-7">
                        <p className="m-0 text-[29px] leading-9.75 font-black text-gold">{formatRand(car.price, " ")}</p>
                        <Link href={href} className="text-lg leading-9.75 font-black text-gold underline">{formatRand(monthlyPayment(car.price), " ")} pm</Link>
                    </div>
                    <h2 className="m-0 mr-2.5 mb-4.25 border-b border-dotted border-[#7c7c7c] pb-3.75 text-lg leading-6 font-medium text-ink min-[1039px]:ml-7">
                        <Link href={href} className="text-ink no-underline hover:text-gold">{car.title}</Link>
                    </h2>
                    <ul className="m-0 mb-3.25 flow-root w-full list-none p-0 min-[1039px]:ml-7">
                        {specs.map(([icon, label]) => (
                            <li key={icon} className="float-left mr-5.75 bg-position-[0_50%] bg-no-repeat pl-5 text-sm leading-[16.1px] font-bold text-[#7c7c7c] max-[675px]:text-[15px] max-[675px]:leading-[17.25px] max-[600px]:mr-0 max-[600px]:mb-1.25 max-[600px]:w-1/2 min-[1039px]:mr-0 min-[1039px]:mb-1.25 min-[1039px]:w-1/2" style={{ backgroundImage: `url(${icon})` }}>
                                {label}
                            </li>
                        ))}
                    </ul>
                    <div className="flex min-[1039px]:max-[1111px]:block">
                        <div className="min-w-0 flex-1">
                            <h4 className="m-0 mr-2.5 mb-1 text-base leading-5.5 font-normal text-ink min-[1039px]:ml-7">
                                <strong>Dealer</strong> {car.dealer.name}
                                <img src="/img/info-icon.svg" alt="" className="ml-1.25 inline size-3.75 align-[-2px]" />
                            </h4>
                            <span className="mr-2.5 mb-3.25 block bg-[url(/img/location-icon-black.svg)] bg-size-[10px] bg-position-[0_50%] bg-no-repeat pl-4 text-sm leading-4.75 text-[#7c7c7c] max-[675px]:text-base min-[1039px]:ml-7">
                                {car.location}
                            </span>
                        </div>
                        <div className="w-31.25 shrink-0 min-[1039px]:max-[1111px]:h-15 min-[1039px]:max-[1111px]:w-auto">
                            <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className="float-right mt-1.25 mr-2.5 block h-9.75 w-28.75 rounded-[5px] bg-[#0a0a0a] text-center text-sm leading-9.75 font-medium whitespace-nowrap text-white no-underline hover:bg-[#1c1c1c] min-[1039px]:max-[1111px]:float-left min-[1039px]:max-[1111px]:ml-7">Watch Review</a>
                        </div>
                    </div>
                    <ul className="m-0 flow-root list-none p-0">
                        {car.gallery.slice(1, 5).map((photo, index) => (
                            <li key={index} className="float-left mr-2.5 w-[calc((100%-40px)/4)]">
                                <Link href={href} aria-label={`${car.title} photo ${index + 2}`} className="block h-18.75 bg-white bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${photo})` }}></Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </li>
        </>
    )
}
