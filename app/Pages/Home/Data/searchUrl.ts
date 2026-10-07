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

const joined = (items: string[]) => (items.length ? [...new Set(items)].join(",") : undefined);

// Turns the app-style search forms into a /cars URL; `preset` (e.g. a Buying page's collection) stays unless the user picked that filter.
// Multi-selects keep every choice (comma-separated); makes keep their models as make:model.
export function buildSearchUrl(values: SearchValues, extra: Record<string, string[]>, preset: CarSearch = {}) {
    const all = (key: string) => joined(extra[key] ?? []);
    const picks = values.makes.map((item) => item.split("|"));
    const makes = picks.map(([make]) => slugify(make));
    const models = picks.filter((pick) => pick[1]).map(([make, model]) => `${slugify(make)}:${slugify(model)}`);
    const variants = picks.filter((pick) => pick[1] && pick[2]).map(([make, model, variant]) => `${slugify(make)}:${slugify(model)}:${slugify(variant)}`);
    const quantity = (key: string) => {
        const value = all(key)?.[0];
        const parsed = value ? Number.parseInt(value, 10) : NaN;
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const search: CarSearch = {
        make: joined(makes),
        model: joined(models),
        variant: joined(variants),
        bodyType: joined(values.bodyTypes),
        minPrice: values.minPrice ?? undefined,
        maxPrice: values.maxPrice ?? undefined,
        minYear: values.minYear ?? undefined,
        maxYear: values.maxYear ?? undefined,
        minMileage: values.minMileage ?? undefined,
        maxMileage: values.maxMileage ?? undefined,
        transmission: all("transmission"),
        fuel: all("fuelType"),
        drive: all("drive"),
        colour: all("colour"),
        province: all("province"),
        vehicleGroup: all("vehicleGroup"),
        specials: all("specials"),
        minEngine: quantity("minEngine"),
        maxEngine: quantity("maxEngine"),
        minKw: quantity("minKw"),
        maxKw: quantity("maxKw"),
        seats: all("seats"),
        cylinders: all("cylinders"),
        dealership: all("dealership"),
    };
    const picked = Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined));
    return carSearchHref({ ...preset, ...picked });
}
