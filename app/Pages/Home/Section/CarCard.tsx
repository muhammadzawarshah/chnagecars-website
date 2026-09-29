import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { carHref, carSpecs, formatRand } from "@/app/lib/cars/format"

export default function CarCard({ car }: { car: Car }) {
    return (
        <>
            <Link href={carHref(car)} className="block h-full overflow-hidden rounded-[10px] bg-white font-roboto no-underline shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <div className="relative aspect-[675/359] w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${car.image})` }}>
                    <span className="absolute top-1.75 right-2.25 flex h-5.75 items-center gap-1 rounded-md bg-white px-1.5 text-xs font-bold text-black">
                        <svg width="13" height="11" viewBox="0 0 14 12" fill="none" stroke="#000" strokeWidth="1.2">
                            <path d="M1 3.5h3l1.2-2h3.6l1.2 2h3v7.5H1z" />
                            <circle cx="7" cy="7" r="2.3" />
                        </svg>
                        {car.photoCount}
                    </span>
                </div>
                <div className="px-2.75 pt-3.5 pb-2.5">
                    <h3 className="m-0 truncate text-base leading-5 font-normal text-[#111]">{car.title}</h3>
                    <p className="mt-1 mb-0 text-lg leading-6 font-bold text-[#957e4e]">{formatRand(car.price)}</p>
                    <p className="mt-1.5 mb-0 flex overflow-hidden text-[13px] leading-4 whitespace-nowrap text-[#9e9e9e]">
                        {carSpecs(car).map((spec, index) => (
                            <span key={spec} className={index === 0 ? "pr-1.25" : "border-l border-[#dcdcdc] px-1.25"}>{spec}</span>
                        ))}
                    </p>
                    <p className="mt-3 mb-0 text-[11.5px] leading-4 text-[#222]">{car.dealer.name}</p>
                    <p className="mt-2 mb-0 flex items-center gap-1.5 text-[11.5px] leading-4 text-[#222]">
                        <svg width="10" height="12" viewBox="0 0 10 13" fill="none" stroke="#957e4e" strokeWidth="1.2">
                            <path d="M5 12s4-4.3 4-7.2A4 4 0 0 0 1 4.8C1 7.7 5 12 5 12z" />
                            <circle cx="5" cy="4.8" r="1.4" />
                        </svg>
                        {car.location}
                    </p>
                </div>
            </Link>
        </>
    )
}
