"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CarSearch, carSearchHref, slugify } from "@/app/lib/cars/search"
import { formatKm, formatRand } from "@/app/lib/cars/format"
import { makes } from "../../Home/Data/makes"
import { bodyTypes, searchProvinces } from "../../Home/Data/search"
import { findFilter } from "../../Home/Data/additionalFilters"
import { appMileages, appYears, cashPrices } from "../../Home/Data/appSearch"
import AdditionalFiltersModal from "../../Home/Section/SideSearch/AdditionalFiltersModal"

type Field = {
    key: keyof CarSearch
    label: string
    options: { value: string, label: string }[]
    wide?: boolean
}

const numbers = (values: number[], format: (value: number) => string) => values.map((value) => ({ value: String(value), label: format(value) }));

const options = (values: string[]) => values.map((value) => ({ value, label: value }));

// Same order as the live results sidebar.
const fields: Field[] = [
    { key: "make", label: "Make / Model / Variant", wide: true, options: makes.map((make) => ({ value: slugify(make.name), label: make.name })) },
    { key: "minPrice", label: "Min Price", options: numbers(cashPrices, formatRand) },
    { key: "maxPrice", label: "Max Price", options: numbers(cashPrices.slice(1), formatRand) },
    { key: "minYear", label: "Min Year", options: numbers(appYears, String) },
    { key: "maxYear", label: "Max Year", options: numbers(appYears, String) },
    { key: "minMileage", label: "Min Mileage", options: numbers(appMileages, formatKm) },
    { key: "maxMileage", label: "Max Mileage", options: numbers(appMileages, formatKm) },
    { key: "bodyType", label: "Body Type", options: options(bodyTypes.map((type) => type.name)) },
    { key: "drive", label: "4X2/4X4", options: options(["4X2", "4X4"]) },
    { key: "transmission", label: "Manual/Auto", options: options(["Manual", "Automatic"]) },
    { key: "fuel", label: "Fuel Type", options: options(["Petrol", "Diesel", "Hybrid", "Electric"]) },
    { key: "province", label: "Province", options: options(searchProvinces.map((province) => province.name)) },
    { key: "colour", label: "Colour", options: options(findFilter("colour").options) },
];

const numberKeys = new Set<keyof CarSearch>(["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage"]);

type RefineSearchProps = {
    search: CarSearch
    inventory: number
    onDone?: () => void
}

export default function RefineSearch({ search, inventory, onDone }: RefineSearchProps) {

    const router = useRouter();
    const [values, setValues] = useState<CarSearch>(search);
    const [more, setMore] = useState(false);

    function update(key: keyof CarSearch, value: string) {
        const next: Record<string, unknown> = { ...values };
        if (!value) delete next[key];
        else next[key] = numberKeys.has(key) ? Number(value) : value;
        setValues(next as CarSearch);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        router.push(carSearchHref({ ...values, sort: search.sort, page: undefined }));
        onDone?.();
    }

    function clear() {
        setValues({});
        router.push("/cars");
        onDone?.();
    }

    return (
        <>
            <form onSubmit={submit} className="font-sans">
                <h2 className="m-0 text-center text-[23px] leading-6.25 font-bold text-gold">{inventory.toLocaleString("en-US").replace(/,/g, " ")}</h2>
                <h2 className="m-0 mb-5 text-center text-[22px] leading-9.75 font-normal text-white">New &amp; Used Cars For Sale</h2>
                <div className="grid grid-cols-2 gap-x-3.75 gap-y-6.25">
                    {fields.map((field) => (
                        <label key={field.key} className={`relative block ${field.wide ? "col-span-2" : ""}`}>
                            <span className="sr-only">{field.label}</span>
                            <select
                                value={String(values[field.key] ?? "")}
                                onChange={(event) => update(field.key, event.target.value)}
                                className="h-10 w-full cursor-pointer appearance-none truncate rounded-t-[3px] border-0 border-b border-white bg-[rgba(245,245,245,0.05)] pr-7.5 pl-3.25 text-sm text-white outline-none [&>option]:text-ink"
                            >
                                <option value="">{field.label}</option>
                                {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            <span className="pointer-events-none absolute top-4.25 right-3.25 border-x-4 border-t-6 border-x-transparent border-t-white"></span>
                        </label>
                    ))}
                </div>
                <div className="mt-6.25 flex h-10 items-center justify-between">
                    <button type="button" onClick={() => setMore(true)} className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-10 font-medium text-white">+ More Filters</button>
                    <button type="submit" className="flex h-10 cursor-pointer items-center rounded-[5px] border-0 bg-gold px-4 text-sm leading-10 text-snow transition hover:opacity-80">
                        <img src="/img/magnifying-glass-white.svg" alt="" className="mr-2.75 size-3.5" />
                        Search Vehicles
                    </button>
                    <button type="button" onClick={clear} className="cursor-pointer border-0 bg-transparent p-0 text-sm text-white hover:underline">Clear Search</button>
                </div>
                {more && (
                    <AdditionalFiltersModal onClose={() => setMore(false)} onApply={() => { setMore(false); router.push(carSearchHref({ ...values, sort: search.sort, page: undefined })); onDone?.(); }} onReset={() => setValues({})}>
                        {fields.map((field) => (
                            <label key={field.key} className={`relative block ${field.wide ? "col-span-2" : ""}`}>
                                <span className="sr-only">{field.label}</span>
                                <select
                                    value={String(values[field.key] ?? "")}
                                    onChange={(event) => update(field.key, event.target.value)}
                                    className="h-10 w-full cursor-pointer appearance-none truncate rounded-[5px] border border-black/30 bg-white pr-7.5 pl-3.25 text-sm text-ink outline-none"
                                >
                                    <option value="">{field.label}</option>
                                    {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                                <span className="pointer-events-none absolute top-4.25 right-3.25 border-x-4 border-t-6 border-x-transparent border-t-ink"></span>
                            </label>
                        ))}
                    </AdditionalFiltersModal>
                )}
            </form>
        </>
    )
}
