"use client"

import { useEffect, useRef, useState } from "react"
<<<<<<< HEAD
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { makes } from "../../Data/makes"
import { maxPrices, minPrices, totalCars, years } from "../../Data/search"
import { appMileages, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import PaymentToggle from "../AppSearch/PaymentToggle"
=======
import AdBanner from "../../../../components/AdBanner"
import { heroAd } from "../../Data/ads"
import { makes } from "../../Data/makes"
import { CountOption, drivenWheels, fuelTypes, maxPrices, mileages, minPrices, totalCars, transmissions, years } from "../../Data/search"
>>>>>>> origin/main
import SelectField from "./SelectField"
import MakeModelSelect from "./MakeModelSelect"
import PriceSelect from "./PriceSelect"
import CustomPriceInputs from "./CustomPriceInputs"
<<<<<<< HEAD
import { monthlyToPrice, priceToMonthly } from "./price"
import ListSelect from "./ListSelect"
import BodyTypeSelect from "./BodyTypeSelect"
import AdditionalFiltersModal from "./AdditionalFiltersModal"
=======
import { formatMoney, monthlyToPrice, priceToMonthly } from "./price"
import ListSelect from "./ListSelect"
import BodyTypeSelect from "./BodyTypeSelect"
import AdditionalFiltersModal from "./AdditionalFiltersModal"
import ProvinceSelect from "./ProvinceSelect"
import ColourSelect from "./ColourSelect"
>>>>>>> origin/main

type Filters = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: string | null
    maxYear: string | null
    minMileage: string | null
    maxMileage: string | null
    bodyTypes: string[]
<<<<<<< HEAD
=======
    drivenWheels: string | null
    transmission: string | null
    fuelType: string | null
    province: string | null
    colours: string[]
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
    drivenWheels: null,
    transmission: null,
    fuelType: null,
    province: null,
    colours: [],
}

function countMap(options: CountOption[]) {
    return Object.fromEntries(options.map((option) => [option.name, option.count]));
>>>>>>> origin/main
}

const emptyCustomMax = { price: "", monthly: "" };

<<<<<<< HEAD
const mileageOptions = appMileages.map((mileage, index) => `${formatNumber(mileage)}${index === appMileages.length - 1 ? "+" : ""} km`);

export default function SideSearch() {

    const { t } = useLanguage();
    const [open, setOpen] = useState<string | null>(null);
    const [monthly, setMonthly] = useState(false);
=======
function formatPrice(value: number | null, fallback: string) {
    return value === null ? fallback : `R${formatMoney(value)}`;
}

function formatList(values: string[], fallback: string) {
    if (values.length === 0) return fallback;
    const first = values[0].split("|").join(" ");
    return values.length === 1 ? first : `${first} + ${values.length - 1} More`;
}

export default function SideSearch() {

    const [open, setOpen] = useState<string | null>(null);
>>>>>>> origin/main
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [showMore, setShowMore] = useState(false);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>({});
    const [customMax, setCustomMax] = useState(emptyCustomMax);
<<<<<<< HEAD
    const asideRef = useRef<HTMLElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

=======
    const [maxLabelSmall, setMaxLabelSmall] = useState(false);
    const asideRef = useRef<HTMLElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const customValue = Number(customMax.price.replace(/\D/g, ""));
    const customOption = customMax.price ? { value: customValue, price: `R${formatMoney(customValue)}`, monthly: `R${formatMoney(priceToMonthly(customValue))} p/m` } : null;

>>>>>>> origin/main
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (asideRef.current && !asideRef.current.contains(e.target as Node)) {
                setOpen(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

<<<<<<< HEAD
    function cashLabel(value: number) {
        const index = cashPrices.indexOf(value);
        return `R ${formatNumber(value)}${index === cashPrices.length - 1 ? "+" : ""}`;
    }

    function monthlyLabel(value: number) {
        const index = cashPrices.indexOf(value);
        const amount = index >= 0 ? monthlyPrices[index] : priceToMonthly(value);
        return `R ${formatNumber(amount)}${t.perMonth}${index === cashPrices.length - 1 ? "+" : ""}`;
    }

    function priceRow(value: number) {
        return { value, price: monthly ? monthlyLabel(value) : cashLabel(value), monthly: monthly ? cashLabel(value) : monthlyLabel(value) };
    }

    function priceLabel(value: number | null, fallback: string) {
        if (value === null) return fallback;
        return monthly ? monthlyLabel(value) : cashLabel(value);
    }

    function listLabel(values: string[], fallback: string) {
        return values.length ? values.map((item) => item.split("|").join(" ")).join(", ") : fallback;
    }

    const customValue = Number(customMax.price.replace(/\D/g, ""));
    const customOption = customMax.price ? priceRow(customValue) : null;

=======
>>>>>>> origin/main
    function toggle(name: string) {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(open === name ? null : name);
    }

    function selectPrice(key: "minPrice" | "maxPrice", value: number, custom: boolean) {
        const next = { ...filters, [key]: value };
        if (key === "maxPrice" && next.minPrice !== null && value < next.minPrice && minPrices.some((option) => option.value === value)) next.minPrice = value;
        if (key === "minPrice" && next.maxPrice !== null && value > next.maxPrice && maxPrices.some((option) => option.value === value)) next.maxPrice = value;
        if ((key === "maxPrice" && !custom) || next.maxPrice !== filters.maxPrice) setCustomMax(emptyCustomMax);
        setFilters(next);
        setOpen(null);
    }

    function enforceMinNotAboveMax() {
        setFilters((current) => {
            const max = current.maxPrice;
            if (current.minPrice === null || max === null || current.minPrice <= max) return current;
            const candidate = minPrices.filter((option) => option.value <= max).pop();
            return { ...current, minPrice: candidate ? candidate.value : null };
        });
    }

    function applyCustomMax(price: number | null, autoClose: boolean) {
        setFilters((current) => ({ ...current, maxPrice: price }));
<<<<<<< HEAD
=======
        if (price !== null && `R${formatMoney(price)}`.length > 9) setMaxLabelSmall(true);
>>>>>>> origin/main
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (autoClose) closeTimer.current = setTimeout(() => { setOpen(null); enforceMinNotAboveMax(); }, 2000);
    }

    function changeCustomPrice(value: string) {
        const raw = value.replace(/\D/g, "").slice(0, 11);
        const price = raw ? Number(raw) : null;
<<<<<<< HEAD
        setCustomMax(price === null ? emptyCustomMax : { price: `R ${formatNumber(price)}`, monthly: `R ${formatNumber(priceToMonthly(price))}` });
=======
        setCustomMax(price === null ? emptyCustomMax : { price: `R${formatMoney(price)}`, monthly: `R${formatMoney(priceToMonthly(price))}` });
>>>>>>> origin/main
        applyCustomMax(price, raw.length > 4);
    }

    function changeCustomMonthly(value: string) {
        const raw = value.replace(/\D/g, "").slice(0, 11);
        const price = raw ? monthlyToPrice(Number(raw)) : null;
<<<<<<< HEAD
        setCustomMax(price === null ? emptyCustomMax : { price: `R ${formatNumber(price)}`, monthly: `R ${formatNumber(Number(raw))}` });
=======
        setCustomMax(price === null ? emptyCustomMax : { price: `R${formatMoney(price)}`, monthly: `R${formatMoney(Number(raw))}` });
>>>>>>> origin/main
        applyCustomMax(price, raw.length > 3);
    }

    function update<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters({ ...filters, [key]: value });
        if (!Array.isArray(value)) setOpen(null);
    }

<<<<<<< HEAD
    function clearSearch() {
        setMonthly(false);
        setFilters(emptyFilters);
        setExtraFilters({});
        setCustomMax(emptyCustomMax);
    }

=======
>>>>>>> origin/main
    function searchUrl() {
        const [makeName, modelName] = (filters.makes[0] ?? "").split("|");
        const make = makes.find((item) => item.name === makeName);
        const model = make?.models.find((item) => item.name === modelName);
        const path = make ? `${make.slug}${model ? `/${model.slug}` : ""}` : "";
        const params = new URLSearchParams();
        if (filters.minPrice) params.set("minprice", String(filters.minPrice));
<<<<<<< HEAD
        if (filters.maxPrice && filters.maxPrice !== cashPrices[cashPrices.length - 1]) params.set("maxprice", String(filters.maxPrice));
        if (filters.minYear) params.set("minyear", filters.minYear);
        if (filters.maxYear) params.set("maxyear", filters.maxYear);
        if (extraFilters.transmission?.[0]) params.set("transmission", extraFilters.transmission[0].toLowerCase());
        if (extraFilters.fuelType?.[0]) params.set("fueltype", extraFilters.fuelType[0].toLowerCase());
=======
        if (filters.maxPrice) params.set("maxprice", String(filters.maxPrice));
        if (filters.minYear) params.set("minyear", filters.minYear);
        if (filters.maxYear) params.set("maxyear", filters.maxYear);
        if (filters.transmission) params.set("transmission", filters.transmission.toLowerCase());
        if (filters.fuelType) params.set("fueltype", filters.fuelType.toLowerCase());
>>>>>>> origin/main
        const query = params.toString();
        return `https://www.changecars.co.za/new-or-used-cars-for-sale/${path}${query ? `?${query}` : ""}`;
    }

    return (
        <>
<<<<<<< HEAD
            <aside ref={asideRef} className="sticky top-2.5 z-2 float-left w-95 rounded-xl pt-0 pr-6.25 pb-6.25 pl-0 max-[1441px]:pt-1.25 max-[1111px]:top-8.75 max-[1111px]:pt-26.25 max-[1111px]:pb-1.25 max-[981px]:float-none max-[981px]:mx-auto max-[981px]:-mt-5.75 max-[981px]:block max-[981px]:w-[80%] max-[981px]:px-5 max-[981px]:pt-6.25 max-[981px]:pb-5 max-[874px]:mt-0 max-[841px]:pt-2.5 max-[681px]:w-auto max-[601px]:pt-0 max-[601px]:pb-0">
                <div className="max-[981px]:hidden">
                    <p className="m-0 text-center text-[15.2px] leading-[1.15] text-white uppercase">
                        {t.taglineStart} <span className="text-[#957e4e]">{t.taglineHighlight}</span>
                    </p>

                    <div className="mt-3.5">
                        <PaymentToggle monthly={monthly} cashLabel={t.cashPrice} monthlyLabel={t.monthlyPayment} onChange={setMonthly} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-5">
                        <SelectField label={priceLabel(filters.minPrice, t.minPrice)} open={open === "minPrice"} onToggle={() => toggle("minPrice")}>
                            <PriceSelect options={minPrices.map((option) => priceRow(option.value))} selected={filters.minPrice} onSelect={(value, custom) => selectPrice("minPrice", value, custom)} />
                        </SelectField>
                        <SelectField label={priceLabel(filters.maxPrice, t.maxPrice)} open={open === "maxPrice"} onToggle={() => toggle("maxPrice")}>
                            <PriceSelect options={maxPrices.map((option) => priceRow(option.value))} selected={filters.maxPrice} customOption={customOption} alignRight onSelect={(value, custom) => selectPrice("maxPrice", value, custom)}>
                                {!monthly && <CustomPriceInputs price={customMax.price} monthly={customMax.monthly} onPriceChange={changeCustomPrice} onMonthlyChange={changeCustomMonthly} onCommit={enforceMinNotAboveMax} />}
                            </PriceSelect>
                        </SelectField>

                        <SelectField label={filters.minYear ?? t.minYear} open={open === "minYear"} onToggle={() => toggle("minYear")}>
                            <ListSelect options={years} selected={filters.minYear} onSelect={(value) => update("minYear", value)} />
                        </SelectField>
                        <SelectField label={filters.maxYear ?? t.maxYear} open={open === "maxYear"} onToggle={() => toggle("maxYear")}>
                            <ListSelect options={years} selected={filters.maxYear} onSelect={(value) => update("maxYear", value)} />
                        </SelectField>

                        <SelectField label={filters.minMileage ?? t.minMileage} open={open === "minMileage"} onToggle={() => toggle("minMileage")}>
                            <ListSelect options={mileageOptions} selected={filters.minMileage} onSelect={(value) => update("minMileage", value)} />
                        </SelectField>
                        <SelectField label={filters.maxMileage ?? t.maxMileage} open={open === "maxMileage"} onToggle={() => toggle("maxMileage")}>
                            <ListSelect options={mileageOptions} selected={filters.maxMileage} onSelect={(value) => update("maxMileage", value)} />
                        </SelectField>

                        <SelectField wide label={listLabel(filters.bodyTypes, t.bodyTypes)} open={open === "bodyType"} onToggle={() => toggle("bodyType")}>
                            <BodyTypeSelect selected={filters.bodyTypes} onChange={(value) => update("bodyTypes", value)} />
                        </SelectField>
                        <SelectField wide label={listLabel(filters.makes, t.makesModels)} open={open === "make"} onToggle={() => toggle("make")}>
                            <MakeModelSelect selected={filters.makes} onChange={(value) => update("makes", value)} onClose={() => setOpen(null)} />
                        </SelectField>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2.5">
                        <button onClick={() => setShowMore(true)} className="flex cursor-pointer items-center border-0 bg-transparent p-0 pl-1 text-[13.8px] text-white hover:underline">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.5">
                                <path d="M5 0v10M0 5h10" />
                            </svg>
                            <span className="ml-[9.33px]">{t.moreFilters}</span>
                        </button>
                        <a href={searchUrl()} className="flex h-10 items-center rounded bg-[#957e4e] px-3.5 text-sm whitespace-nowrap text-white no-underline transition duration-100 hover:opacity-80">
                            {t.searchCars.replace("{count}", totalCars)}
                        </a>
                        <button onClick={clearSearch} className="cursor-pointer border-0 bg-transparent p-0 text-[13.8px] text-white hover:underline">{t.clearSearch}</button>
                    </div>
                </div>

=======
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
                        <PriceSelect options={minPrices} selected={filters.minPrice} onSelect={(value, custom) => selectPrice("minPrice", value, custom)} />
                    </SelectField>
                    <SelectField label={formatPrice(filters.maxPrice, "Max Price")} open={open === "maxPrice"} onToggle={() => toggle("maxPrice")} small={maxLabelSmall} className="w-[48%]">
                        <PriceSelect options={maxPrices} selected={filters.maxPrice} customOption={customOption} alignRight onSelect={(value, custom) => selectPrice("maxPrice", value, custom)}>
                            <CustomPriceInputs price={customMax.price} monthly={customMax.monthly} onPriceChange={changeCustomPrice} onMonthlyChange={changeCustomMonthly} onCommit={enforceMinNotAboveMax} />
                        </PriceSelect>
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
                    <a onClick={() => { setFilters(emptyFilters); setExtraFilters({}); setCustomMax(emptyCustomMax); setMaxLabelSmall(false); }} className="block cursor-pointer text-center text-sm text-white hover:underline">Clear Search</a>
                </div>

                <AdBanner ad={heroAd} className="mx-auto mt-7.5 mb-12.5 hidden w-full max-w-199 clear-both max-[601px]:block" />

>>>>>>> origin/main
                {showMore && (
                    <AdditionalFiltersModal
                        values={extraFilters}
                        onChange={setExtraFilters}
                        onClose={() => setShowMore(false)}
                        onSearch={() => { window.location.href = searchUrl(); }}
                    />
                )}

<<<<<<< HEAD
=======

>>>>>>> origin/main
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
