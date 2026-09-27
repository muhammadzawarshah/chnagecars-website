export type AdditionalFilter = {
    key: string
    label: string
    options: string[]
    info?: string
}

function range(start: number, end: number, step: number, unit: string) {
    return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => `${start + i * step} ${unit}`);
}

export const additionalFilters: AdditionalFilter[] = [
<<<<<<< HEAD
    { key: "transmission", label: "Transmission", options: ["Manual", "Automatic"] },
    { key: "fuelType", label: "Fuel Type(s)", options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
    { key: "drive", label: "Drive", options: ["4X2", "4X4"] },
    { key: "colour", label: "Colour(s)", options: ["Beige", "Black", "Blue", "Brown", "Gold", "Green", "Grey", "Orange", "Pink", "Purple", "Red", "Silver", "White", "Yellow"] },
=======
>>>>>>> origin/main
    { key: "vehicleGroup", label: "Vehicle Category", options: ["New", "Almost new", "Used", "Classic"], info: "By default all options are shown" },
    { key: "specials", label: "Specials", options: ["Not on special", "On special"] },
    { key: "minEngine", label: "Min Engine Size", options: ["50 cc", "125 cc", "150 cc", ...range(500, 6500, 500, "cc")] },
    { key: "maxEngine", label: "Max Engine Size", options: ["125 cc", "150 cc", ...range(500, 7000, 500, "cc")] },
    { key: "minKw", label: "Min kW", options: range(25, 700, 25, "kW") },
    { key: "maxKw", label: "Max kW", options: range(50, 700, 25, "kW") },
    { key: "seats", label: "No. of Seats", options: ["2", "3", "4", "5", "6", "7", "8+"] },
    { key: "cylinders", label: "Cylinders", options: ["1-2", "3-5", "6-8", "10-12"] },
];
