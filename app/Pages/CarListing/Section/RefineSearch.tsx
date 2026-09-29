"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CarSearch, carSearchHref, slugify } from "@/app/lib/cars/search"
import { formatKm, formatRand } from "@/app/lib/cars/format"
import { makes } from "../../Home/Data/makes"
import { bodyTypes, searchProvinces } from "../../Home/Data/search"
import { findFilter } from "../../Home/Data/additionalFilters"
import { appMileages, appYears, cashPrices } from "../../Home/Data/appSearch"

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
    { key: "make", label: "Make", wide: true, options: makes.map((make) => ({ value: slugify(make.name), label: make.name })) },
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
                <h2 className="m-0 mb-6 text-center font-normal">
                    <span className="block text-[30px] leading-9 text-gold">{inventory.toLocaleString("en-US").replace(/,/g, " ")}</span>
                    <span className="block text-2xl leading-8 text-white">New &amp; Used Cars For Sale</span>
                </h2>
                <div className="grid grid-cols-2 gap-x-3.75 gap-y-6">
                    {fields.map((field) => (
                        <label key={field.key} className={`relative block ${field.wide ? "col-span-2" : ""}`}>
                            <span className="sr-only">{field.label}</span>
                            <select
                                value={String(values[field.key] ?? "")}
                                onChange={(event) => update(field.key, event.target.value)}
                                className="h-10 w-full cursor-pointer appearance-none truncate rounded-t-[3px] border-0 border-b border-white bg-white/5 pr-9 pl-3.25 text-base text-white outline-none max-[675px]:text-base [&>option]:text-ink"
                            >
                                <option value="">{field.label}</option>
                                {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            <span className="pointer-events-none absolute top-4.25 right-4.25 border-x-4 border-t-6 border-x-transparent border-t-white"></span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                    <button type="submit" className="flex h-11 cursor-pointer items-center gap-2.5 rounded border-0 bg-gold px-4 text-base text-white transition hover:opacity-80">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="6.8" cy="6.8" r="5.3" /><path d="M10.8 10.8L15 15" strokeLinecap="round" /></svg>
                        Search Vehicles
                    </button>
                    <button type="button" onClick={clear} className="cursor-pointer border-0 bg-transparent p-0 text-base text-white hover:underline">Clear Search</button>
                </div>
            </form>
        </>
    )
}
