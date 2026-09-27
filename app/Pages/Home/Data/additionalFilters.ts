import { dealerships } from "./dealerships"
import { searchProvinces } from "./search"

export type AdditionalFilter = {
    key: string
    label: string
    options: string[]
    info?: string
    multiple?: boolean
    searchable?: boolean
}

function range(start: number, end: number, step: number, unit: string) {
    return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => `${start + i * step} ${unit}`);
}

export const additionalFilters: AdditionalFilter[] = [
    { key: "transmission", label: "Transmission", options: ["Manual", "Automatic"] },
    { key: "fuelType", label: "Fuel Type(s)", options: ["Petrol", "Diesel", "Hybrid", "Electric"], multiple: true },
    { key: "drive", label: "Drive", options: ["4X2", "4X4"] },
    { key: "colour", label: "Colour(s)", options: ["Beige", "Black", "Blue", "Brown", "Gold", "Green", "Grey", "Orange", "Pink", "Purple", "Red", "Silver", "White", "Yellow"], multiple: true },
    { key: "vehicleGroup", label: "Vehicle Category", options: ["New", "Almost new", "Used", "Classic"], info: "By default all options are shown", multiple: true },
    { key: "specials", label: "Specials", options: ["Not on special", "On special"] },
    { key: "minEngine", label: "Min Engine Size", options: ["50 cc", "125 cc", "150 cc", ...range(500, 6500, 500, "cc")] },
    { key: "maxEngine", label: "Max Engine Size", options: ["125 cc", "150 cc", ...range(500, 7000, 500, "cc")] },
    { key: "minKw", label: "Min kW", options: range(25, 700, 25, "kW") },
    { key: "maxKw", label: "Max kW", options: range(50, 700, 25, "kW") },
    { key: "seats", label: "No. of Seats", options: ["2", "3", "4", "5", "6", "7", "8+"] },
    { key: "cylinders", label: "Cylinders", options: ["1-2", "3-5", "6-8", "10-12"] },
    { key: "province", label: "Province", options: searchProvinces.map((province) => province.name), searchable: true },
    { key: "dealership", label: "Dealership Name", options: dealerships.map((dealer) => dealer.name), multiple: true, searchable: true },
];

export const filterRows = {
    popup: ["transmission", "fuelType", "drive", "colour", "vehicleGroup", "specials", "minEngine", "maxEngine", "minKw", "maxKw", "seats", "cylinders"],
    popupWide: ["province", "dealership"],
};

export function findFilter(key: string) {
    return additionalFilters.find((filter) => filter.key === key)!;
}
