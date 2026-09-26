"use client"

import { useEffect, useRef, useState } from "react"
import { makes } from "../../Data/makes"
import { CountOption, drivenWheels, fuelTypes, maxPrices, mileages, minPrices, totalCars, transmissions, years } from "../../Data/search"
import SelectField from "./SelectField"
import MakeModelSelect from "./MakeModelSelect"
import PriceSelect from "./PriceSelect"
import ListSelect from "./ListSelect"
import BodyTypeSelect from "./BodyTypeSelect"
import AdditionalFiltersModal from "./AdditionalFiltersModal"
import ProvinceSelect from "./ProvinceSelect"
import ColourSelect from "./ColourSelect"

type Filters = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: string | null
    maxYear: string | null
    minMileage: string | null
    maxMileage: string | null
    bodyTypes: string[]
    drivenWheels: string | null
    transmission: string | null
    fuelType: string | null
    province: string | null
    colours: string[]
}

const emptyFilters: Filters = {
    makes: [],
    minPrice: null,
    maxPrice: null,
    minYear: null,
    maxYear: null,
    minMileage: null,
    maxMileage: null,
    bodyTypes: [],
    drivenWheels: null,
    transmission: null,
    fuelType: null,
    province: null,
    colours: [],
}

function countMap(options: CountOption[]) {
    return Object.fromEntries(options.map((option) => [option.name, option.count]));
}

function formatPrice(value: number | null, fallback: string) {
    return value === null ? fallback : `R${value.toLocaleString("en-ZA").replace(/,/g, " ")}`;
}

function formatList(values: string[], fallback: string) {
    if (values.length === 0) return fallback;
    const first = values[0].split("|").join(" ");
    return values.length === 1 ? first : `${first} + ${values.length - 1} More`;
}

export default function SideSearch() {

    const [open, setOpen] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [showMore, setShowMore] = useState(false);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>({});
    const asideRef = useRef<HTMLElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (asideRef.current && !asideRef.current.contains(e.target as Node)) {
                setOpen(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function toggle(name: string) {
        setOpen(open === name ? null : name);
    }

    function update<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters({ ...filters, [key]: value });
        if (!Array.isArray(value)) setOpen(null);
    }

    function searchUrl() {
        const [makeName, modelName] = (filters.makes[0] ?? "").split("|");
        const make = makes.find((item) => item.name === makeName);
        const model = make?.models.find((item) => item.name === modelName);
        const path = make ? `${make.slug}${model ? `/${model.slug}` : ""}` : "";
        const params = new URLSearchParams();
        if (filters.minPrice) params.set("minprice", String(filters.minPrice));
        if (filters.maxPrice) params.set("maxprice", String(filters.maxPrice));
        if (filters.minYear) params.set("minyear", filters.minYear);
        if (filters.maxYear) params.set("maxyear", filters.maxYear);
        if (filters.transmission) params.set("transmission", filters.transmission.toLowerCase());
        if (filters.fuelType) params.set("fueltype", filters.fuelType.toLowerCase());
        const query = params.toString();
        return `https://www.changecars.co.za/new-or-used-cars-for-sale/${path}${query ? `?${query}` : ""}`;
    }

    return (
        <>
            <aside ref={asideRef} className="sticky top-2.5 z-2 float-left w-95 rounded-xl pt-0 pr-6.25 pb-6.25 pl-0 max-[1441px]:pt-1.25 max-[1111px]:top-8.75 max-[1111px]:pt-26.25 max-[1111px]:pb-1.25 max-[981px]:float-none max-[981px]:mx-auto max-[981px]:-mt-5.75 max-[981px]:block max-[981px]:w-[80%] max-[981px]:px-5 max-[981px]:pt-6.25 max-[981px]:pb-5 max-[874px]:mt-0 max-[841px]:pt-2.5 max-[681px]:w-auto max-[601px]:pb-0">
                <h2 className="m-0 w-full text-center text-[23px] leading-6.25 font-bold whitespace-nowrap text-gold max-[1041px]:leading-7.75 max-[981px]:mb-3.75 max-[981px]:leading-5.75 max-[981px]:text-wrap">
                    {totalCars}
                </h2>
                <h2 className="m-0 mb-6.25 w-full text-center text-[22px] leading-5.5 font-normal whitespace-nowrap text-white max-[981px]:text-wrap">
                    <span className="inline-block w-0.75"></span>New & Used Cars For Sale
                </h2>

                <div className="flex flex-wrap justify-between">
                    <SelectField label={formatList(filters.makes, "Make / Model / Variant")} open={open === "make"} onToggle={() => toggle("make")} className="w-full">
                        <MakeModelSelect selected={filters.makes} onChange={(value) => update("makes", value)} onClose={() => setOpen(null)} />
                    </SelectField>

                    <SelectField label={formatPrice(filters.minPrice, "Min Price")} open={open === "minPrice"} onToggle={() => toggle("minPrice")} className="w-[48%]">
                        <PriceSelect options={minPrices} selected={filters.minPrice} onSelect={(value) => update("minPrice", value)} />
                    </SelectField>
                    <SelectField label={formatPrice(filters.maxPrice, "Max Price")} open={open === "maxPrice"} onToggle={() => toggle("maxPrice")} className="w-[48%]">
                        <PriceSelect options={maxPrices} selected={filters.maxPrice} alignRight onSelect={(value) => update("maxPrice", value)} />
                    </SelectField>

                    <SelectField label={filters.minYear ?? "Min Year"} open={open === "minYear"} onToggle={() => toggle("minYear")} className="w-[48%]">
                        <ListSelect options={years} selected={filters.minYear} onSelect={(value) => update("minYear", value)} />
                    </SelectField>
                    <SelectField label={filters.maxYear ?? "Max Year"} open={open === "maxYear"} onToggle={() => toggle("maxYear")} className="w-[48%]">
                        <ListSelect options={years} selected={filters.maxYear} onSelect={(value) => update("maxYear", value)} />
                    </SelectField>

                    <SelectField label={filters.minMileage ?? "Min Mileage"} open={open === "minMileage"} onToggle={() => toggle("minMileage")} className="w-[48%]">
                        <ListSelect options={mileages} selected={filters.minMileage} onSelect={(value) => update("minMileage", value)} />
                    </SelectField>
                    <SelectField label={filters.maxMileage ?? "Max Mileage"} open={open === "maxMileage"} onToggle={() => toggle("maxMileage")} className="w-[48%]">
                        <ListSelect options={mileages} selected={filters.maxMileage} onSelect={(value) => update("maxMileage", value)} />
                    </SelectField>

                    <SelectField label={formatList(filters.bodyTypes, "Body Type")} open={open === "bodyType"} onToggle={() => toggle("bodyType")} className="w-[48%]">
                        <BodyTypeSelect selected={filters.bodyTypes} onChange={(value) => update("bodyTypes", value)} />
                    </SelectField>
                    <SelectField label={filters.drivenWheels ?? "4X2/4X4"} open={open === "drivenWheels"} onToggle={() => toggle("drivenWheels")} className="w-[48%]">
                        <ListSelect options={drivenWheels.map((item) => item.name)} counts={countMap(drivenWheels)} selected={filters.drivenWheels} onSelect={(value) => update("drivenWheels", value)} />
                    </SelectField>

                    <SelectField label={filters.transmission ?? "Manual/Auto"} open={open === "transmission"} onToggle={() => toggle("transmission")} className="w-[48%]">
                        <ListSelect options={transmissions.map((item) => item.name)} counts={countMap(transmissions)} scroll={false} selected={filters.transmission} onSelect={(value) => update("transmission", value)} />
                    </SelectField>
                    <SelectField label={filters.fuelType ?? "Fuel Type"} open={open === "fuelType"} onToggle={() => toggle("fuelType")} className="w-[48%]">
                        <ListSelect options={fuelTypes.map((item) => item.name)} counts={countMap(fuelTypes)} scroll={false} selected={filters.fuelType} onSelect={(value) => update("fuelType", value)} />
                    </SelectField>

                    <SelectField label={filters.province ?? "Province"} open={open === "province"} onToggle={() => toggle("province")} className="w-[48%]">
                        <ProvinceSelect selected={filters.province} onSelect={(value) => update("province", value)} onClose={() => setOpen(null)} />
                    </SelectField>
                    <SelectField label={formatList(filters.colours, "Colour")} open={open === "colour"} onToggle={() => toggle("colour")} className="w-[48%]">
                        <ColourSelect selected={filters.colours} onChange={(value) => update("colours", value)} />
                    </SelectField>
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-1.25 max-[981px]:mb-5 max-[981px]:justify-center max-[981px]:gap-5 max-[601px]:mb-13.75 max-[601px]:gap-3.75 max-[461px]:gap-1.75">
                    <a onClick={() => setShowMore(true)} className="cursor-pointer text-sm leading-10 font-medium text-white hover:underline">+ More Filters</a>
                    <a href={searchUrl()} className="block h-10 w-38 cursor-pointer rounded-[5px] bg-gold text-center text-sm leading-10 font-normal text-snow no-underline transition duration-100 hover:opacity-80">
                        <span className="mr-2.75 -mb-0.5 inline-block size-3.5 bg-[url(/img/magnifying-glass-white.svg)] bg-contain bg-no-repeat"></span>
                        Search Vehicles
                    </a>
                    <a onClick={() => { setFilters(emptyFilters); setExtraFilters({}); }} className="block cursor-pointer text-center text-sm text-white hover:underline">Clear Search</a>
                </div>

                {showMore && (
                    <AdditionalFiltersModal
                        values={extraFilters}
                        onChange={setExtraFilters}
                        onClose={() => setShowMore(false)}
                        onSearch={() => { window.location.href = searchUrl(); }}
                    />
                )}


                <div className="mt-12.5 inline-block w-full max-[981px]:mt-5 max-[981px]:-mb-2.5 max-[601px]:hidden">
                    <a href="https://www.changecars.co.za/sell-your-vehicle" className="absolute top-[calc(100%-30px)] left-0 block max-[1111px]:top-[calc(100%-16px)] max-[981px]:relative max-[981px]:top-auto max-[981px]:left-auto max-[981px]:mx-auto max-[981px]:w-full max-[981px]:max-w-88.75">
                        <img src="/img/banners/cc-sell-your-vehicle.gif" alt="Sell Your Vehicle" className="block" />
                    </a>
                </div>

                <div className="relative -left-10 hidden w-[calc(100%+80px)] bg-[#e8e4e4] px-7.5 pt-10 pb-12.5 text-center max-[601px]:block">
                    <h2 className="mx-auto mb-3.75 text-[32px] leading-9.75 font-extralight text-gold uppercase">SELL YOUR <strong className="font-black">VEHICLE</strong></h2>
                    <p className="mt-3.5 mb-7.5 text-sm leading-5 text-coal">
                        <strong>CHANGECARS</strong> makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                    </p>
                    <a href="https://www.changecars.co.za/sell-your-vehicle" className="relative mx-auto block h-10 w-fit cursor-pointer rounded-[5px] bg-gold pr-2.5 pl-10 text-center text-base leading-9.75 whitespace-nowrap text-white no-underline before:absolute before:top-0.5 before:left-2.5 before:block before:h-3.75 before:w-5 before:content-[url(/img/private-sellers/key-in-hand.svg)]">
                        Sell Your Vehicle
                    </a>
                </div>
            </aside>
        </>
    )
}
