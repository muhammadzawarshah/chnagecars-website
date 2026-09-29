"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "../../../../components/Language/LanguageContext"
import { bodyTypes, totalCars } from "../../Data/search"
import { filterRows, findFilter } from "../../Data/additionalFilters"
import { buildSearchUrl } from "../../Data/searchUrl"
import { AppOption, appMileages, appYears, cashPrices, formatNumber, monthlyPrices } from "../../Data/appSearch"
import PaymentToggle from "../AppSearch/PaymentToggle"
import SelectField from "./SelectField"
import FilterSelect from "./FilterSelect"
import OptionMenu, { MenuItem } from "./OptionMenu"
import MakeModelSelect from "./MakeModelSelect"
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
    const [open, setOpen] = useState<string | null>(null);
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
    const ranges: Record<RangeKey, { placeholder: string, options: AppOption[] }> = {
        minPrice: { placeholder: t.minPrice, options: priceOptions },
        maxPrice: { placeholder: t.maxPrice, options: priceOptions.slice(1) },
        minYear: { placeholder: t.minYear, options: yearOptions },
        maxYear: { placeholder: t.maxYear, options: yearOptions },
        minMileage: { placeholder: t.minMileage, options: mileageOptions },
        maxMileage: { placeholder: t.maxMileage, options: mileageOptions },
    };

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!(event.target as Element).closest("[data-select]")) setOpen(null);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function listLabel(values: string[], fallback: string) {
        return values.length ? values.map((item) => item.split("|").join(" ")).join(", ") : fallback;
    }

    function rangeLabel(key: RangeKey) {
        const value = filters[key];
        return ranges[key].options.find((option) => option.value === value)?.label ?? ranges[key].placeholder;
    }

    function toggle(name: string) {
        setOpen(open === name ? null : name);
    }

    function rangeItems(key: RangeKey): MenuItem[] {
        return ranges[key].options.map((option) => ({
            id: String(option.value),
            label: option.label,
            selected: filters[key] === option.value,
            onSelect: () => key === "minPrice" || key === "maxPrice" ? selectPrice(key, option.value) : update(key, option.value),
        }));
    }

    function bodyTypeItems(): MenuItem[] {
        return bodyTypes.map((type) => {
            const selected = filters.bodyTypes.includes(type.name);
            return {
                id: type.name,
                label: type.name,
                selected,
                onSelect: () => update("bodyTypes", selected ? filters.bodyTypes.filter((item) => item !== type.name) : [...filters.bodyTypes, type.name]),
            };
        });
    }

    function choiceItems(key: string): MenuItem[] {
        const current = extraFilters[key] ?? [];
        const multiple = !!findFilter(key).multiple;
        const anyItem: MenuItem = { id: "any", label: t.any, selected: current.length === 0, onSelect: () => selectChoice(key, [], true) };
        return [anyItem, ...findFilter(key).options.map((option) => {
            const selected = current.includes(option);
            const next = multiple ? (selected ? current.filter((item) => item !== option) : [...current, option]) : (selected ? [] : [option]);
            return { id: option, label: option, selected, onSelect: () => selectChoice(key, next, !multiple) };
        })];
    }

    function menuFor(key: string) {
        const filter = findFilter(key);
        return <OptionMenu items={choiceItems(key)} info={filter.info} searchPlaceholder={filter.searchable ? `Search ${filter.label}` : undefined} />;
    }

    function choiceField(key: string, wide: boolean) {
        const filter = findFilter(key);
        return (
            <FilterSelect key={key} wide={wide} label={listLabel(extraFilters[key] ?? [], filter.label)} active={!!extraFilters[key]?.length} open={open === `more-${key}`} onToggle={() => toggle(`more-${key}`)}>
                {menuFor(key)}
            </FilterSelect>
        );
    }

    function selectChoice(key: string, value: string[], close: boolean) {
        setExtraFilters({ ...extraFilters, [key]: value });
        if (close) setOpen(null);
    }

    function closeMore() {
        setShowMore(false);
        setOpen(null);
    }

    function resetFilters() {
        setFilters(emptyFilters);
        setExtraFilters({});
        setOpen(null);
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
        if (!Array.isArray(value)) setOpen(null);
    }

    function clearSearch() {
        setMonthly(false);
        resetFilters();
    }

    function searchUrl() {
        return buildSearchUrl(filters, extraFilters);
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
                                <OptionMenu items={rangeItems(key)} />
                            </SelectField>
                        ))}
                        <SelectField wide label={listLabel(filters.bodyTypes, t.bodyTypes)} open={open === "bodyType"} onToggle={() => toggle("bodyType")}>
                            <OptionMenu items={bodyTypeItems()} />
                        </SelectField>
                        <SelectField wide label={listLabel(filters.makes, t.makesModels)} open={open === "make"} onToggle={() => toggle("make")}>
                            {open === "make" && <MakeModelSelect selected={filters.makes} onChange={(value) => update("makes", value)} />}
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
                    <AdditionalFiltersModal onClose={closeMore} onApply={closeMore} onReset={resetFilters}>
                        {filterRows.popup.map((key) => choiceField(key, false))}
                        {filterRows.popupWide.map((key) => choiceField(key, true))}
                    </AdditionalFiltersModal>
                )}

                <div className="mt-12.5 inline-block w-full max-[981px]:mt-5 max-[981px]:-mb-2.5 max-[601px]:hidden">
                    <a href="/sell-your-vehicle" className="absolute top-[calc(100%-30px)] left-0 block max-[1111px]:top-[calc(100%-16px)] max-[981px]:relative max-[981px]:top-auto max-[981px]:left-auto max-[981px]:mx-auto max-[981px]:w-full max-[981px]:max-w-88.75">
                        <img src="/img/banners/cc-sell-your-vehicle.gif" alt="Sell Your Vehicle" className="block" />
                    </a>
                </div>
            </aside>
        </>
    )
}
