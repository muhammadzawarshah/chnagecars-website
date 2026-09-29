import { CarSearch, carSearchHref, slugify } from "@/app/lib/cars/search"

export type SearchValues = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: number | null
    maxYear: number | null
    minMileage: number | null
    maxMileage: number | null
    bodyTypes: string[]
}

// Turns the home page search forms into a /cars URL.
// CarSearch holds one value per filter for now, so multi-selects use the first choice.
export function buildSearchUrl(values: SearchValues, extra: Record<string, string[]>) {
    const first = (key: string) => extra[key]?.[0];
    const [makeName, modelName] = values.makes[0]?.split("|") ?? [];

    const search: CarSearch = {
        make: makeName ? slugify(makeName) : undefined,
        model: modelName ? slugify(modelName) : undefined,
        bodyType: values.bodyTypes[0],
        minPrice: values.minPrice ?? undefined,
        maxPrice: values.maxPrice ?? undefined,
        minYear: values.minYear ?? undefined,
        maxYear: values.maxYear ?? undefined,
        minMileage: values.minMileage ?? undefined,
        maxMileage: values.maxMileage ?? undefined,
        transmission: first("transmission"),
        fuel: first("fuelType"),
        drive: first("drive"),
        colour: first("colour"),
        province: first("province"),
    };
    return carSearchHref(search);
}
