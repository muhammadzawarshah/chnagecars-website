"use client"

import { useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { AppOption, appMileages, appTotalCars, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import { additionalFilters, findFilter } from "../../Data/additionalFilters"
import { buildSearchUrl } from "../../Data/searchUrl"
import HeroAd from "../HeroAd"
import PaymentToggle from "./PaymentToggle"
import AppField from "./AppField"
import OptionSheet from "./OptionSheet"
import BodyTypeSheet from "./BodyTypeSheet"
import MakesSheet from "./MakesSheet"
import ChoiceSheet from "./ChoiceSheet"
import FiltersPage from "./FiltersPage"
import FilterField from "./FilterField"

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

const rangeKeys: RangeKey[] = ["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage"];

function isRange(key: string): key is RangeKey {
    return rangeKeys.includes(key as RangeKey);
}

export default function AppSearch() {

    const { t } = useLanguage();
    const [monthly, setMonthly] = useState(false);
    const [values, setValues] = useState<AppValues>(emptyValues);
    const [sheet, setSheet] = useState<string | null>(null);
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

    function choiceLabel(key: string) {
        const selected = extraFilters[key] ?? [];
        return selected.length ? selected.join(", ") : findFilter(key).label;
    }

    function choiceField(key: string, wide: boolean) {
        return <FilterField key={key} wide={wide} label={choiceLabel(key)} active={!!extraFilters[key]?.length} onClick={() => setSheet(key)} />;
    }

    function resetFilters() {
        setValues(emptyValues);
        setExtraFilters({});
    }

    function searchUrl() {
        return buildSearchUrl(values, extraFilters);
    }

    function clearSearch() {
        setMonthly(false);
        resetFilters();
    }

    return (
        <>
            <section className="hidden bg-black px-5 pt-10 pb-[29.67px] max-[981px]:block max-[301px]:px-2.5">
                <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="mx-auto block h-auto w-[209.33px] max-w-full" />
                <p className="mt-[17.2px] mb-0 text-center text-[15.2px] leading-[1.15] text-white uppercase">
                    {t.taglineStart} <span className="text-[#957e4e]">{t.taglineHighlight}</span>
                </p>

                <div className="mt-3.5">
                    <PaymentToggle monthly={monthly} cashLabel={t.cashPrice} monthlyLabel={t.monthlyPayment} onChange={setMonthly} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-5 max-[301px]:grid-cols-1 max-[301px]:gap-y-3">
                    {rangeKeys.map((key) => (
                        <AppField key={key} label={rangeLabel(key)} onClick={() => setSheet(key)} />
                    ))}
                    <AppField wide className="col-span-2 max-[301px]:col-span-1" label={values.bodyTypes.length ? values.bodyTypes.join(", ") : t.bodyTypes} onClick={() => setSheet("bodyTypes")} />
                    <AppField wide className="col-span-2 max-[301px]:col-span-1" label={makesLabel()} onClick={() => setSheet("makes")} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
                    <button onClick={() => setShowMore(true)} className="flex cursor-pointer items-center border-0 bg-transparent p-0 pl-1 text-[13.8px] text-white">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.5">
                            <path d="M5 0v10M0 5h10" />
                        </svg>
                        <span className="ml-[9.33px]">{t.moreFilters}</span>
                    </button>
                    <a href={searchUrl()} className="flex h-10 min-w-[min(31vw,190px)] items-center justify-center rounded bg-[#957e4e] px-2.5 text-sm whitespace-nowrap text-white no-underline max-[251px]:h-auto max-[251px]:min-h-10 max-[251px]:py-2 max-[251px]:text-center max-[251px]:whitespace-normal">
                        {t.searchCars.replace("{count}", appTotalCars)}
                    </a>
                    <button onClick={clearSearch} className="cursor-pointer border-0 bg-transparent p-0 pl-[9.34px] text-[13.8px] text-white">{t.clearSearch}</button>
                </div>
            </section>

            <HeroAd className="max-[601px]:block" />

            {showMore && (
                <FiltersPage onBack={() => setShowMore(false)} onApply={() => setShowMore(false)} onReset={resetFilters}>
                    {rangeKeys.map((key) => (
                        <FilterField key={key} label={rangeLabel(key)} active={values[key] !== null} onClick={() => setSheet(key)} />
                    ))}
                    {choiceField("transmission", false)}
                    {choiceField("fuelType", false)}
                    <FilterField wide label={values.bodyTypes.length ? values.bodyTypes.join(", ") : t.bodyTypes} active={values.bodyTypes.length > 0} onClick={() => setSheet("bodyTypes")} />
                    <FilterField wide label={makesLabel()} active={values.makes.length > 0} onClick={() => setSheet("makes")} />
                    {choiceField("drive", true)}
                    {choiceField("colour", true)}
                </FiltersPage>
            )}
            {sheet && additionalFilters.some((filter) => filter.key === sheet) && (
                <ChoiceSheet
                    title={findFilter(sheet).label}
                    options={findFilter(sheet).options}
                    selected={extraFilters[sheet] ?? []}
                    multiple={findFilter(sheet).multiple}
                    info={findFilter(sheet).info}
                    searchable={findFilter(sheet).searchable}
                    onApply={(selected) => { setExtraFilters({ ...extraFilters, [sheet]: selected }); setSheet(null); }}
                    onClose={() => setSheet(null)}
                />
            )}
            {sheet && isRange(sheet) && (
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
        </>
    )
}
