"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { clearCompare, CompareCar, onCompareChange, readCompare, removeCompare } from "./compareStore"

// Gold "View comparisons" tab at the bottom of the screen; it slides the chosen cars up.
export default function CompareBar() {

    const [cars, setCars] = useState<CompareCar[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const sync = () => setCars(readCompare());
        sync();
        return onCompareChange(sync);
    }, []);

    if (cars.length === 0 && !open) return null;

    return (
        <>
            <div className={`fixed inset-x-0 bottom-0 z-79 font-sans transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-full"}`}>
                <button type="button" onClick={() => setOpen(!open)} className="absolute right-8.25 -top-10.75 z-10 flex h-10.75 cursor-pointer items-center rounded-t-[10px] border-0 bg-gold pr-9.75 pl-7.5 text-lg leading-10.75 font-bold text-white uppercase">
                    <img src="/img/car-detail/orig/compare-vehicle-icon.svg" alt="" className="mr-1.25 size-5.75" />
                    View comparisons
                </button>
                <div className="relative mr-8.25 ml-[max(20px,calc(100%-1160px))] max-h-[80vh] overflow-y-auto rounded-tl-[10px] bg-white px-5 py-8.75 shadow-[0.67px_5.87px_23px_rgba(0,0,0,0.3)] max-[700px]:mx-0">
                    <div className="mb-8.75 flex flex-wrap items-start">
                        <h2 className="m-0 mr-10 mb-[28.22px] text-[34px] leading-[39.1px] font-light text-black max-[700px]:text-[26px]">VIEW COMPARE <span className="font-black text-gold">VEHICLES</span></h2>
                        <p className="m-0 mt-1.25 text-[26px] leading-[29.9px] font-light text-black max-[700px]:text-xl">YOU HAVE CHOSEN <strong className="font-bold">{cars.length}</strong> VEHICLES</p>
                    </div>
                    {cars.length === 0 ? (
                        <>
                            <p className="m-0 mb-7.5 text-sm leading-5 text-black">No vehicles have been added to compare yet.</p>
                            <button type="button" onClick={() => setOpen(false)} className="h-8.25 cursor-pointer rounded-[5px] border-0 bg-black px-4 text-sm text-white">Close Compare</button>
                        </>
                    ) : (
                        <>
                            <ul className="m-0 mb-3.75 flex list-none overflow-x-auto p-0">
                                {cars.map((car) => (
                                    <li key={car.id} className="relative mr-6.25 w-63.25 shrink-0">
                                        <button type="button" onClick={() => removeCompare(car.id)} aria-label={`Remove ${car.title}`} className="absolute top-2.5 right-2.5 z-500 size-5.5 cursor-pointer rounded-full border-0 bg-[#929292] bg-[url(/img/car-detail/orig/close-popup.svg)] bg-size-[10px] bg-center bg-no-repeat p-0"></button>
                                        <Link href={car.href} className="block no-underline">
                                            <div className="mb-4 h-40 rounded-[5px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${car.image})` }}></div>
                                            <p className="m-0 mb-2.5 truncate text-lg leading-[20.7px] text-black">{car.title}</p>
                                            <h3 className="m-0 text-lg leading-[20.7px] font-black text-[#a39161]">R{car.price.toLocaleString("en-US").replace(/,/g, " ")}</h3>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex h-10 items-center justify-end gap-6">
                                <button type="button" onClick={clearCompare} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm leading-[16.1px] font-semibold text-black">Clear All</button>
                                <Link href="/login" className="h-10 rounded-[5px] bg-gold px-7 text-sm leading-10 font-semibold text-white no-underline">View All</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
