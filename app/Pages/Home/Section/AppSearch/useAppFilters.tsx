"use client"

import { useEffect, useState } from "react"
import { CarSearch, filterValues, slugify } from "@/app/lib/cars/search"
import { makes } from "../../Data/makes"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { AppOption, appMileages, appTotalCars, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
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

// Form values for a search already in the address, so the filter form shows what is active.
function valuesFrom(search: CarSearch): AppValues {
    const picked: string[] = [];
    const models = filterValues(search.model);
    for (const makeSlug of filterValues(search.make)) {
        const make = makes.find((item) => slugify(item.name) === makeSlug);
        if (!make) continue;
        const chosen = make.models.filter((model) => models.some((item) => {
            const value = item.split(":").pop()!;
            const normalize = (text: string) => slugify(text).replace(/-class$/, "");
            return normalize(value) === normalize(model.name) || (normalize(value).startsWith(`${normalize(model.name)}-`) && normalize(value).split("-").filter((part) => part !== "series").every((part) => slugify(model.name).includes(part) || part === normalize(model.name).split("-").at(-1)));
        }));
        if (chosen.length) chosen.forEach((model) => {
            picked.push(`${make.name}|${model.name}`);
            for (const selected of filterValues(search.variant)) {
                const parts = selected.split(":");
                if (parts.length > 2 && parts[0] === makeSlug && parts[1] === slugify(model.name)) picked.push(`${make.name}|${model.name}|${parts.at(-1)}`);
            }
        });
        else picked.push(make.name);
    }
    return {
        minPrice: search.minPrice ?? null,
        maxPrice: search.maxPrice ?? null,
        minYear: search.minYear ?? null,
        maxYear: search.maxYear ?? null,
        minMileage: search.minMileage ?? null,
        maxMileage: search.maxMileage ?? null,
        bodyTypes: filterValues(search.bodyType),
        makes: picked,
    };
}

function extrasFrom(search: CarSearch): Record<string, string[]> {
    const extras: Record<string, string[]> = {};
    const add = (key: string, value?: string) => { const items = filterValues(value); if (items.length) extras[key] = items; };
    add("transmission", search.transmission);
    add("fuelType", search.fuel);
    add("drive", search.drive);
    add("colour", search.colour);
    add("province", search.province);
    add("vehicleGroup", search.vehicleGroup);
    add("specials", search.specials);
    const optionForValue = (key: string, value: number | undefined) => value === undefined ? undefined : findFilter(key).options.find((option) => Number.parseInt(option, 10) === value) ?? String(value);
    add("minEngine", optionForValue("minEngine", search.minEngine));
    add("maxEngine", optionForValue("maxEngine", search.maxEngine));
    add("minKw", optionForValue("minKw", search.minKw));
    add("maxKw", optionForValue("maxKw", search.maxKw));
    add("seats", search.seats);
    add("cylinders", search.cylinders);
    add("dealership", search.dealership);
    const provinceOptions = findFilter("province").options;
    if (extras.province) extras.province = extras.province.map((value) => provinceOptions.find((option) => slugify(option) === slugify(value)) ?? value);
    return extras;
}

// State, labels and pick-lists of the app-style car search (home hero and the Buying filter pages).
// `preset` is kept in the search URL, e.g. the collection of a Buying page; `initial` fills the form with the current search.
export default function useAppFilters(preset: CarSearch = {}, initial: CarSearch = {}) {

    const { t } = useLanguage();
    const [monthly, setMonthly] = useState(false);
    const [values, setValues] = useState<AppValues>(() => valuesFrom(initial));
    const [sheet, setSheet] = useState<string | null>(null);
    const [extraFilters, setExtraFilters] = useState<Record<string, string[]>>(() => extrasFrom(initial));
    const [matchingCount, setMatchingCount] = useState<string>(appTotalCars);

    useEffect(() => {
        const controller = new AbortController();
        const hasFilters = values.minPrice !== null || values.maxPrice !== null || values.minYear !== null || values.maxYear !== null || values.minMileage !== null || values.maxMileage !== null || values.bodyTypes.length > 0 || values.makes.length > 0 || Object.values(extraFilters).some((arr) => arr.length > 0);

        const timer = setTimeout(async () => {
            if (!hasFilters) {
                setMatchingCount(appTotalCars);
                return;
            }
            try {
                const body: Record<string, unknown> = {};
                if (values.minPrice !== null) body.minPrice = values.minPrice;
                if (values.maxPrice !== null) body.maxPrice = values.maxPrice;
                if (values.minYear !== null) body.minYear = values.minYear;
                if (values.maxYear !== null) body.maxYear = values.maxYear;
                if (values.minMileage !== null) body.minMileage = values.minMileage;
                if (values.maxMileage !== null) body.maxMileage = values.maxMileage;
                if (values.bodyTypes.length) body.bodyType = values.bodyTypes.join(",");
                if (values.makes.length) {
                    body.make = values.makes.map((m) => m.replace(/\|/g, ":")).join(",");
                }
                for (const [k, v] of Object.entries(extraFilters)) {
                    if (v?.length) body[k] = v.join(",");
                }

                const response = await fetch("/api/vehicles/count", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data?.formatted !== undefined) {
                        setMatchingCount(String(data.formatted));
                    }
                }
            } catch {
                // Aborted or error: retain current count
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [values, extraFilters]);

    function updateRange(key: RangeKey, value: number | null) {
        const pairs: Partial<Record<RangeKey, RangeKey>> = { minPrice: "maxPrice", maxPrice: "minPrice", minYear: "maxYear", maxYear: "minYear", minMileage: "maxMileage", maxMileage: "minMileage" };
        const other = pairs[key];
        setValues((current) => ({ ...current, [key]: value, ...(other && value !== null && current[other] !== null && (key.startsWith("min") ? value > current[other]! : value < current[other]!) ? { [other]: value } : {}) }));
    }

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
        setMatchingCount(appTotalCars);
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
                    onSelect={(value) => { updateRange(sheet, value); setSheet(null); }}
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

    return { t, monthly, setMonthly, values, extraFilters, openSheet: setSheet, rangeLabel, makesLabel, bodyTypesLabel, choiceLabel, reset, searchUrl, sheets, matchingCount }
}
