"use client"

import { useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { makes } from "../../Data/makes"
import { totalCars } from "../../Data/search"
import { AppOption, appMileages, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import PaymentToggle from "../AppSearch/PaymentToggle"
import OptionSheet from "../AppSearch/OptionSheet"
import BodyTypeSheet from "../AppSearch/BodyTypeSheet"
import MakesSheet from "../AppSearch/MakesSheet"
import SelectField from "./SelectField"
import AdditionalFiltersModal from "./AdditionalFiltersModal"

type Filters = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: number | null
    maxYear: number | null
    minMileage: number | null
    maxMileage: number | null
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

type RangeKey = "minPrice" | "maxPrice" | "minYear" | "maxYear" | "minMileage" | "maxMileage"

const rangeKeys: RangeKey[] = ["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage"];

export default function SideSearch() {

    const { t } = useLanguage();
    const [open, setOpen] = useState<RangeKey | "bodyType" | "make" | null>(null);
    const [monthly, setMonthly] = useState(false);
    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [showMore, setShowMore] = useState(false);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>({});
    const priceOptions: AppOption[] = cashPrices.map((price, index) => ({
        value: price,
        label: monthly
            ? `R ${formatNumber(monthlyPrices[index])}${t.perMonth}${index === cashPrices.length - 1 ? "+" : ""}`
            : `R ${formatNumber(price)}${index === cashPrices.length - 1 ? "+" : ""}`,
    }));
    const yearOptions: AppOption[] = appYears.map((year) => ({ value: year, label: String(year) }));
    const mileageOptions: AppOption[] = appMileages.map((mileage, index) => ({
        value: mileage,
        label: `${formatNumber(mileage)}${index === appMileages.length - 1 ? "+" : ""} km`,
    }));
    const ranges: Record<RangeKey, { title: string, placeholder: string, options: AppOption[], fallback: number }> = {
        minPrice: { title: t.priceMinTitle, placeholder: t.minPrice, options: priceOptions, fallback: cashPrices[0] },
        maxPrice: { title: t.priceMaxTitle, placeholder: t.maxPrice, options: priceOptions.slice(1), fallback: cashPrices[cashPrices.length - 1] },
        minYear: { title: t.yearMinTitle, placeholder: t.minYear, options: yearOptions, fallback: appYears[appYears.length - 1] },
        maxYear: { title: t.yearMaxTitle, placeholder: t.maxYear, options: yearOptions, fallback: appYears[0] },
        minMileage: { title: t.mileageMinTitle, placeholder: t.minMileage, options: mileageOptions, fallback: appMileages[0] },
        maxMileage: { title: t.mileageMaxTitle, placeholder: t.maxMileage, options: mileageOptions, fallback: appMileages[appMileages.length - 1] },
    };

    function listLabel(values: string[], fallback: string) {
        return values.length ? values.map((item) => item.split("|").join(" ")).join(", ") : fallback;
    }

    function rangeLabel(key: RangeKey) {
        const value = filters[key];
        return ranges[key].options.find((option) => option.value === value)?.label ?? ranges[key].placeholder;
    }

    function toggle(name: RangeKey | "bodyType" | "make") {
        setOpen(open === name ? null : name);
    }

    function selectPrice(key: "minPrice" | "maxPrice", value: number) {
        const next = { ...filters, [key]: value };
        if (key === "maxPrice" && next.minPrice !== null && value < next.minPrice) next.minPrice = value;
        if (key === "minPrice" && next.maxPrice !== null && value > next.maxPrice) next.maxPrice = value;
        setFilters(next);
        setOpen(null);
    }

    function update<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters({ ...filters, [key]: value });
        setOpen(null);
    }

    function clearSearch() {
        setMonthly(false);
        setFilters(emptyFilters);
        setExtraFilters({});
    }

    function searchUrl() {
        const [makeName, modelName] = (filters.makes[0] ?? "").split("|");
        const make = makes.find((item) => item.name === makeName);
        const model = make?.models.find((item) => item.name === modelName);
        const path = make ? `${make.slug}${model ? `/${model.slug}` : ""}` : "";
        const params = new URLSearchParams();
        if (filters.minPrice) params.set("minprice", String(filters.minPrice));
        if (filters.maxPrice && filters.maxPrice !== cashPrices[cashPrices.length - 1]) params.set("maxprice", String(filters.maxPrice));
        if (filters.minYear) params.set("minyear", String(filters.minYear));
        if (filters.maxYear) params.set("maxyear", String(filters.maxYear));
        if (extraFilters.transmission?.[0]) params.set("transmission", extraFilters.transmission[0].toLowerCase());
        if (extraFilters.fuelType?.[0]) params.set("fueltype", extraFilters.fuelType[0].toLowerCase());
        const query = params.toString();
        return `https://www.changecars.co.za/new-or-used-cars-for-sale/${path}${query ? `?${query}` : ""}`;
    }

    return (
        <>
            <aside className="sticky top-2.5 z-2 float-left w-95 rounded-xl pt-0 pr-6.25 pb-6.25 pl-0 max-[1441px]:pt-1.25 max-[1111px]:top-8.75 max-[1111px]:pt-26.25 max-[1111px]:pb-1.25 max-[981px]:float-none max-[981px]:mx-auto max-[981px]:-mt-5.75 max-[981px]:block max-[981px]:w-[80%] max-[981px]:px-5 max-[981px]:pt-6.25 max-[981px]:pb-5 max-[874px]:mt-0 max-[841px]:pt-2.5 max-[681px]:w-auto max-[601px]:pt-0 max-[601px]:pb-0">
                <div className="max-[981px]:hidden">
                    <p className="m-0 text-center text-[15.2px] leading-[1.15] text-white uppercase">
                        {t.taglineStart} <span className="text-[#957e4e]">{t.taglineHighlight}</span>
                    </p>

                    <div className="mt-3.5">
                        <PaymentToggle monthly={monthly} cashLabel={t.cashPrice} monthlyLabel={t.monthlyPayment} onChange={setMonthly} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-5">
                        {rangeKeys.map((key) => (
                            <SelectField key={key} label={rangeLabel(key)} open={open === key} onToggle={() => toggle(key)}>
                                {open === key && (
                                    <OptionSheet
                                        title={ranges[key].title}
                                        options={ranges[key].options}
                                        selected={filters[key]}
                                        fallback={ranges[key].fallback}
                                        onSelect={(value) => key === "minPrice" || key === "maxPrice" ? selectPrice(key, value) : update(key, value)}
                                        onClose={() => setOpen(null)}
                                    />
                                )}
                            </SelectField>
                        ))}
                        <SelectField wide label={listLabel(filters.bodyTypes, t.bodyTypes)} open={open === "bodyType"} onToggle={() => toggle("bodyType")}>
                            {open === "bodyType" && <BodyTypeSheet selected={filters.bodyTypes} onApply={(value) => update("bodyTypes", value)} onClose={() => setOpen(null)} />}
                        </SelectField>
                        <SelectField wide label={listLabel(filters.makes, t.makesModels)} open={open === "make"} onToggle={() => toggle("make")}>
                            {open === "make" && <MakesSheet selected={filters.makes} onApply={(value) => update("makes", value)} onClose={() => setOpen(null)} />}
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
