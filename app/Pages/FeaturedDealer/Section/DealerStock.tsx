"use client"

import Link from "next/link"
import { ReactNode, useEffect, useState } from "react"
import { Car } from "@/app/lib/cars/types"
import { carHref, formatRand } from "@/app/lib/cars/format"
import DealerShare from "./DealerShare"
import FilterPill from "./FilterPill"

type SortKey = "price-asc" | "price-desc" | "recent" | "mileage-asc" | "mileage-desc" | "year-asc" | "year-desc"

const sortOptions: { value: SortKey, label: string }[] = [
    { value: "price-asc", label: "Price low to high" },
    { value: "price-desc", label: "Price high to low" },
    { value: "recent", label: "Most Recent" },
    { value: "mileage-asc", label: "Mileage low to high" },
    { value: "mileage-desc", label: "Mileage high to low" },
    { value: "year-asc", label: "Oldest to newest" },
    { value: "year-desc", label: "Newest to oldest" },
];

const sorters: Record<SortKey, (a: Car, b: Car) => number> = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "recent": (a, b) => b.listedAt.localeCompare(a.listedAt),
    "mileage-asc": (a, b) => a.mileage - b.mileage,
    "mileage-desc": (a, b) => b.mileage - a.mileage,
    "year-asc": (a, b) => a.year - b.year,
    "year-desc": (a, b) => b.year - a.year,
};

const unique = (values: string[]) => [...new Set(values)].sort();

type DealerStockProps = {
    cars: Car[]
    dealer: string
    dealerFont: string
    top: ReactNode
}

export default function DealerStock({ cars, dealer, dealerFont, top }: DealerStockProps) {

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [body, setBody] = useState("");
    const [sort, setSort] = useState<SortKey>("mileage-asc");
    const [open, setOpen] = useState<string | null>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!(event.target as Element).closest("[data-filter-pill]")) setOpen(null);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const shown = cars
        .filter((car) => (!make || car.make === make) && (!model || car.model === model) && (!body || car.bodyType === body))
        .sort(sorters[sort]);
    const models = unique(cars.filter((car) => !make || car.make === make).map((car) => car.model));
    const results = `${shown.length} Results`;

    function pill(name: string) {
        return { open: open === name, onToggle: () => setOpen(open === name ? null : name) };
    }

    const spec = "w-fit bg-position-[left_center] bg-no-repeat pl-5 text-sm leading-[16.1px] font-bold tracking-[0.03em] text-[#7c7c7c] max-[676px]:text-base max-[676px]:leading-[18.4px]";

    return (
        <>
            <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[max(725px,100%)]">
                <div className="absolute inset-0 -z-1 bg-[url(/img/featured-dealer/dealer-bg.jpg)] bg-cover bg-top bg-no-repeat min-[1301px]:-top-82.5 min-[1301px]:bottom-82.5"></div>
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,#1a1a1a_80%)]"></div>
                <div className="absolute inset-x-0 top-3.75 -bottom-3.75 z-1 bg-[linear-gradient(0deg,#1a1a1a_0%,rgba(255,255,255,0)_100%)] min-[1301px]:bottom-[311.25px]"></div>
            </div>
            <div className="relative z-1 mx-auto max-w-350 px-3.75 max-[981px]:pt-12.5">
            {top}
            <div className="relative mt-2.75 ml-auto w-fit pl-3.75 max-[1101px]:pl-0 max-[801px]:top-3.75 max-[801px]:flex max-[801px]:w-full max-[801px]:justify-between">
                <span className="relative top-3.25 hidden text-base leading-8 text-white max-[801px]:block">{results}</span>
                <DealerShare />
            </div>

            <div className="mt-7.5 flow-root pb-7.5">
                <span className="float-left text-base leading-[18.4px] font-medium tracking-[0.03em] text-white max-[801px]:hidden">{results}</span>
                <div className="float-right flex flex-wrap justify-end max-[1001px]:w-[calc(100%-110px)] max-[801px]:w-full">
                <div className="ml-7.5 flex max-[1001px]:mb-3.75 max-[801px]:mb-0 max-[801px]:ml-3.75 max-[801px]:items-end max-[801px]:gap-3.75 max-[651px]:flex-wrap max-[651px]:justify-end">
                    <FilterPill {...pill("make")} className="mr-7.5 max-[801px]:mt-3.75 max-[801px]:mr-0" prefix="Filter by:" label={make || "Make"} heading="Make" value={make} options={[{ value: "", label: "Make" }, ...unique(cars.map((car) => car.make)).map((item) => ({ value: item, label: item }))]} onSelect={(value) => { setMake(value); setModel(""); setOpen(null); }} />
                    <FilterPill {...pill("model")} className="max-[801px]:mt-3.75" prefix="Filter by:" label={model || "Model"} heading="Model" value={model} options={[{ value: "", label: "Model" }, ...models.map((item) => ({ value: item, label: item }))]} onSelect={(value) => { setModel(value); setOpen(null); }} />
                </div>
                <div className="relative ml-7.5 flex flex-row-reverse gap-7.5 max-[1001px]:ml-0 max-[1001px]:w-full max-[801px]:items-center max-[801px]:gap-3.75">
                    <FilterPill {...pill("sort")} className="z-2 max-[801px]:mt-3.75" prefix="Sort by:" label={sortOptions.find((item) => item.value === sort)?.label ?? ""} heading="Sort by" value={sort} options={sortOptions} onSelect={(value) => { setSort(value as SortKey); setOpen(null); }} />
                    <FilterPill {...pill("body")} className="z-2 max-[801px]:mt-3.75" prefix="Filter by:" label={body || "Body Type"} heading="Body Type" value={body} options={[{ value: "", label: "All Body Type" }, ...unique(cars.map((car) => car.bodyType)).map((item) => ({ value: item, label: item }))]} onSelect={(value) => { setBody(value); setOpen(null); }} />
                </div>
                </div>
            </div>
            </div>
            </div>

            <div className="relative z-1 mx-auto max-w-350 px-3.75">
            {shown.length === 0 ? (
                <div className="min-h-90">
                    <p className="mx-auto my-0 max-w-[733px] pt-2.5 text-center text-base leading-5 font-bold text-white">Sorry! We currently have no vehicles that match your search criteria, please check again later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-x-22.5 gap-y-15 pb-15 max-[1120px]:grid-cols-[repeat(2,calc(50%-59.5px))] max-[1081px]:grid-cols-2 max-[1081px]:gap-x-15 max-[762px]:grid-cols-1">
                    {shown.map((car) => (
                        <Link key={car.id} href={carHref(car)} className="block no-underline">
                            <div className="h-full overflow-hidden rounded-[5px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.2)]">
                                <div className="h-68.75 overflow-hidden max-[762px]:h-auto max-[762px]:pb-[3px]">
                                    <img src={car.image} alt={car.title} loading="lazy" className="block h-68.75 w-full object-cover max-[762px]:aspect-[4/3] max-[762px]:h-auto" />
                                </div>
                                <ul className="m-0 list-none p-6.25">
                                    <li className="mb-1.25 text-[32px] leading-[36.8px] font-black tracking-[0.03em] text-[#a39161]">{formatRand(car.price, " ")}</li>
                                    <li className="mb-3.75 h-12 overflow-hidden text-xl leading-5.75 font-bold tracking-[0.03em] text-ink">{car.title}</li>
                                    <li className="mb-5 h-7.5 border-t border-[#7c7c7c] pt-3.75">
                                        <ul className="m-0 mb-3.75 flex list-none justify-between p-0">
                                            <li className={`${spec} bg-[url(/img/car-detail/orig/icon-cal.svg)] bg-size-[13px_auto]`}>{car.year}</li>
                                            <li className={`${spec} bg-[url(/img/car-detail/orig/icon-km.svg)] bg-size-[15px_auto]`}>{car.mileage.toLocaleString("en-US").replace(/,/g, " ")} KM</li>
                                            <li className={`${spec} bg-[url(/img/car-detail/orig/icon-tran.svg)] bg-size-[10px_auto]`}>{car.transmission}</li>
                                            <li className={`${spec} bg-[url(/img/car-detail/orig/icon-fuel.svg)] bg-size-[13px_auto]`}>{car.fuel}</li>
                                        </ul>
                                    </li>
                                    <li className={`mb-3.75 h-3.5 text-base leading-[18.4px] text-ink ${dealerFont}`}>
                                        <strong className="float-left font-bold">Dealer&nbsp;</strong>
                                        <span className="float-left">{dealer}</span>
                                        <img src="/img/car-detail/orig/dealer-rating-i.svg" alt="" className="float-left mt-0.5 ml-1.25 size-3.75" />
                                    </li>
                                </ul>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            </div>
        </>
    )
}
