"use client"

import { useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { makes } from "../../Data/makes"
import { totalCars } from "../../Data/search"
import { AppOption, appMileages, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import AdditionalFiltersModal from "../SideSearch/AdditionalFiltersModal"
import AdBanner from "../../../../components/AdBanner"
import { heroAd } from "../../Data/ads"
import PaymentToggle from "./PaymentToggle"
import AppField from "./AppField"
import OptionSheet from "./OptionSheet"
import BodyTypeSheet from "./BodyTypeSheet"
import MakesSheet from "./MakesSheet"

type RangeKey = "minPrice" | "maxPrice" | "minYear" | "maxYear" | "minMileage" | "maxMileage"

type AppValues = Record<RangeKey, number | null> & {
    bodyTypes: string[]
    makes: string[]
}

const emptyValues: AppValues = {
    minPrice: null,
    maxPrice: null,
    minYear: null,
    maxYear: null,
    minMileage: null,
    maxMileage: null,
    bodyTypes: [],
    makes: [],
};

export default function AppSearch() {

    const { t } = useLanguage();
    const [monthly, setMonthly] = useState(false);
    const [values, setValues] = useState<AppValues>(emptyValues);
    const [sheet, setSheet] = useState<RangeKey | "bodyTypes" | "makes" | null>(null);
    const [showMore, setShowMore] = useState(false);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>({});

    const priceOptions: AppOption[] = cashPrices.map((price, index) => {
        const plus = index === cashPrices.length - 1 ? "+" : "";
        return { value: price, label: monthly ? `R ${formatNumber(monthlyPrices[index])}${t.perMonth}${plus}` : `R ${formatNumber(price)}${plus}` };
    });
    const yearOptions: AppOption[] = appYears.map((year) => ({ value: year, label: String(year) }));
    const mileageOptions: AppOption[] = appMileages.map((mileage, index) => ({ value: mileage, label: `${formatNumber(mileage)}${index === appMileages.length - 1 ? "+" : ""} km` }));

    const ranges: Record<RangeKey, { title: string, placeholder: string, options: AppOption[], fallback: number }> = {
        minPrice: { title: t.priceMinTitle, placeholder: t.minPrice, options: priceOptions, fallback: cashPrices[0] },
        maxPrice: { title: t.priceMaxTitle, placeholder: t.maxPrice, options: priceOptions.slice(1), fallback: cashPrices[cashPrices.length - 1] },
        minYear: { title: t.yearMinTitle, placeholder: t.minYear, options: yearOptions, fallback: appYears[appYears.length - 1] },
        maxYear: { title: t.yearMaxTitle, placeholder: t.maxYear, options: yearOptions, fallback: appYears[0] },
        minMileage: { title: t.mileageMinTitle, placeholder: t.minMileage, options: mileageOptions, fallback: appMileages[0] },
        maxMileage: { title: t.mileageMaxTitle, placeholder: t.maxMileage, options: mileageOptions, fallback: appMileages[appMileages.length - 1] },
    };

    function rangeLabel(key: RangeKey) {
        const value = values[key];
        return ranges[key].options.find((option) => option.value === value)?.label ?? ranges[key].placeholder;
    }

    function makesLabel() {
        if (values.makes.length === 0) return t.makesModels;
        return values.makes.map((item) => item.split("|").join(" ")).join(", ");
    }

    function searchUrl() {
        const [makeName, modelName] = (values.makes[0] ?? "").split("|");
        const make = makes.find((item) => item.name === makeName);
        const model = make?.models.find((item) => item.name === modelName);
        const path = make ? `${make.slug}${model ? `/${model.slug}` : ""}` : "";
        const params = new URLSearchParams();
        if (values.minPrice) params.set("minprice", String(values.minPrice));
        if (values.maxPrice && values.maxPrice !== cashPrices[cashPrices.length - 1]) params.set("maxprice", String(values.maxPrice));
        if (values.minYear) params.set("minyear", String(values.minYear));
        if (values.maxYear) params.set("maxyear", String(values.maxYear));
        const query = params.toString();
        return `https://www.changecars.co.za/new-or-used-cars-for-sale/${path}${query ? `?${query}` : ""}`;
    }

    function clearSearch() {
        setMonthly(false);
        setValues(emptyValues);
        setExtraFilters({});
    }

    const rangeKeys: RangeKey[] = ["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage"];

    return (
        <>
            <section className="hidden bg-black px-5 pt-10 pb-[29.67px] max-[981px]:block">
                <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="mx-auto block h-[44.4px] w-auto" />
                <p className="mt-[17.2px] mb-0 text-center text-[15.2px] leading-[1.15] text-white uppercase">
                    {t.taglineStart} <span className="text-[#957e4e]">{t.taglineHighlight}</span>
                </p>

                <div className="mt-3.5">
                    <PaymentToggle monthly={monthly} cashLabel={t.cashPrice} monthlyLabel={t.monthlyPayment} onChange={setMonthly} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-5">
                    {rangeKeys.map((key) => (
                        <AppField key={key} label={rangeLabel(key)} onClick={() => setSheet(key)} />
                    ))}
                    <AppField wide className="col-span-2" label={values.bodyTypes.length ? values.bodyTypes.join(", ") : t.bodyTypes} onClick={() => setSheet("bodyTypes")} />
                    <AppField wide className="col-span-2" label={makesLabel()} onClick={() => setSheet("makes")} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => setShowMore(true)} className="flex cursor-pointer items-center border-0 bg-transparent p-0 pl-1 text-[13.8px] text-white">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.5">
                            <path d="M5 0v10M0 5h10" />
                        </svg>
                        <span className="ml-[9.33px]">{t.moreFilters}</span>
                    </button>
                    <a href={searchUrl()} className="flex h-10 items-center rounded bg-[#957e4e] px-[48.33px] text-sm whitespace-nowrap text-white no-underline">
                        {t.searchCars.replace("{count}", totalCars)}
                    </a>
                    <button onClick={clearSearch} className="cursor-pointer border-0 bg-transparent p-0 pl-[9.34px] text-[13.8px] text-white">{t.clearSearch}</button>
                </div>
            </section>

            <div className="hidden bg-[#f8fafd] px-2.5 pt-[20.67px] pb-5 max-[981px]:block">
                <AdBanner ad={heroAd} className="block w-full" />
            </div>

            {sheet && sheet !== "bodyTypes" && sheet !== "makes" && (
                <OptionSheet
                    title={ranges[sheet].title}
                    options={ranges[sheet].options}
                    selected={values[sheet]}
                    fallback={ranges[sheet].fallback}
                    onSelect={(value) => { setValues({ ...values, [sheet]: value }); setSheet(null); }}
                    onClose={() => setSheet(null)}
                />
            )}
            {sheet === "bodyTypes" && (
                <BodyTypeSheet selected={values.bodyTypes} onApply={(bodyTypes) => { setValues({ ...values, bodyTypes }); setSheet(null); }} onClose={() => setSheet(null)} />
            )}
            {sheet === "makes" && (
                <MakesSheet selected={values.makes} onApply={(selected) => { setValues({ ...values, makes: selected }); setSheet(null); }} onClose={() => setSheet(null)} />
            )}
            {showMore && (
                <AdditionalFiltersModal
                    values={extraFilters}
                    onChange={setExtraFilters}
                    onClose={() => setShowMore(false)}
                    onSearch={() => { window.location.href = searchUrl(); }}
                />
            )}
        </>
    )
}
