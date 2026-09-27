"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { makes } from "../../Data/makes"
import { maxPrices, minPrices, totalCars, years } from "../../Data/search"
import { appMileages, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import PaymentToggle from "../AppSearch/PaymentToggle"
import SelectField from "./SelectField"
import MakeModelSelect from "./MakeModelSelect"
import PriceSelect from "./PriceSelect"
import CustomPriceInputs from "./CustomPriceInputs"
import { monthlyToPrice, priceToMonthly } from "./price"
import ListSelect from "./ListSelect"
import BodyTypeSelect from "./BodyTypeSelect"
import AdditionalFiltersModal from "./AdditionalFiltersModal"

type Filters = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: string | null
    maxYear: string | null
    minMileage: string | null
    maxMileage: string | null
    bodyTypes: string[]
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
}

const emptyCustomMax = { price: "", monthly: "" };

const mileageOptions = appMileages.map((mileage, index) => `${formatNumber(mileage)}${index === appMileages.length - 1 ? "+" : ""} km`);

export default function SideSearch() {

    const { t } = useLanguage();
    const [open, setOpen] = useState<string | null>(null);
    const [monthly, setMonthly] = useState(false);
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [showMore, setShowMore] = useState(false);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>({});
    const [customMax, setCustomMax] = useState(emptyCustomMax);
    const asideRef = useRef<HTMLElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (asideRef.current && !asideRef.current.contains(e.target as Node)) {
                setOpen(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

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
        if (closeTimer.current) clearTimeout(closeTimer.current);
        if (autoClose) closeTimer.current = setTimeout(() => { setOpen(null); enforceMinNotAboveMax(); }, 2000);
    }

    function changeCustomPrice(value: string) {
        const raw = value.replace(/\D/g, "").slice(0, 11);
        const price = raw ? Number(raw) : null;
        setCustomMax(price === null ? emptyCustomMax : { price: `R ${formatNumber(price)}`, monthly: `R ${formatNumber(priceToMonthly(price))}` });
        applyCustomMax(price, raw.length > 4);
    }

    function changeCustomMonthly(value: string) {
        const raw = value.replace(/\D/g, "").slice(0, 11);
        const price = raw ? monthlyToPrice(Number(raw)) : null;
        setCustomMax(price === null ? emptyCustomMax : { price: `R ${formatNumber(price)}`, monthly: `R ${formatNumber(Number(raw))}` });
        applyCustomMax(price, raw.length > 3);
    }

    function update<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters({ ...filters, [key]: value });
        if (!Array.isArray(value)) setOpen(null);
    }

    function clearSearch() {
        setMonthly(false);
        setFilters(emptyFilters);
        setExtraFilters({});
        setCustomMax(emptyCustomMax);
    }

    function searchUrl() {
        const [makeName, modelName] = (filters.makes[0] ?? "").split("|");
        const make = makes.find((item) => item.name === makeName);
        const model = make?.models.find((item) => item.name === modelName);
        const path = make ? `${make.slug}${model ? `/${model.slug}` : ""}` : "";
        const params = new URLSearchParams();
        if (filters.minPrice) params.set("minprice", String(filters.minPrice));
        if (filters.maxPrice && filters.maxPrice !== cashPrices[cashPrices.length - 1]) params.set("maxprice", String(filters.maxPrice));
        if (filters.minYear) params.set("minyear", filters.minYear);
        if (filters.maxYear) params.set("maxyear", filters.maxYear);
        if (extraFilters.transmission?.[0]) params.set("transmission", extraFilters.transmission[0].toLowerCase());
        if (extraFilters.fuelType?.[0]) params.set("fueltype", extraFilters.fuelType[0].toLowerCase());
        const query = params.toString();
        return `https://www.changecars.co.za/new-or-used-cars-for-sale/${path}${query ? `?${query}` : ""}`;
    }

    return (
        <>
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
