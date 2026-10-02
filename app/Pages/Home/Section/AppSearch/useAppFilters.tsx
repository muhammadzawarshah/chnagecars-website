"use client"

import { useState } from "react"
import { CarSearch } from "@/app/lib/cars/search"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { AppOption, appMileages, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import { additionalFilters, findFilter } from "../../Data/additionalFilters"
import { buildSearchUrl } from "../../Data/searchUrl"
import OptionSheet from "./OptionSheet"
import BodyTypeSheet from "./BodyTypeSheet"
import MakesSheet from "./MakesSheet"
import ChoiceSheet from "./ChoiceSheet"

export type RangeKey = "minPrice" | "maxPrice" | "minYear" | "maxYear" | "minMileage" | "maxMileage"

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

export const rangeKeys: RangeKey[] = ["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage"];

function isRange(key: string): key is RangeKey {
    return rangeKeys.includes(key as RangeKey);
}

// State, labels and pick-lists of the app-style car search (home hero and the Buying filter pages).
// `preset` is kept in the search URL, e.g. the collection of a Buying page.
export default function useAppFilters(preset: CarSearch = {}) {

    const { t } = useLanguage();
    const [monthly, setMonthly] = useState(false);
    const [values, setValues] = useState<AppValues>(emptyValues);
    const [sheet, setSheet] = useState<string | null>(null);
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

    function bodyTypesLabel() {
        return values.bodyTypes.length ? values.bodyTypes.join(", ") : t.bodyTypes;
    }

    function choiceLabel(key: string) {
        const selected = extraFilters[key] ?? [];
        return selected.length ? selected.join(", ") : findFilter(key).label;
    }

    function reset() {
        setValues(emptyValues);
        setExtraFilters({});
    }

    function searchUrl() {
        return buildSearchUrl(values, extraFilters, preset);
    }

    const sheets = (
        <>
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
    );

    return { t, monthly, setMonthly, values, extraFilters, openSheet: setSheet, rangeLabel, makesLabel, bodyTypesLabel, choiceLabel, reset, searchUrl, sheets }
}
