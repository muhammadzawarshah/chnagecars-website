import { Car } from "./types"
import { mockCars } from "./mockCars"
import { CarCollection, CarSearch, CarSearchResult, filterValues, PAGE_SIZE, SortKey, slugify } from "./search"
import { unstable_rethrow } from "next/navigation"
import { backendEnabled, publicGet, queryString, softly } from "../backend/client"

// Every page gets car listings from here. With API_URL set, each function reads the
// ChangeCars API (backend/src/modules/web, same shapes as ./types); without it the
// sample data below is used. Pages and components stay the same either way.

export async function getAllCars(): Promise<Car[]> {
    if (backendEnabled()) {
        // Used to pre-build car pages; if the API is down the pages are built on first visit instead.
        try {
            return (await publicGet<Car[]>("/web/cars/all")) ?? [];
        } catch (error) {
            unstable_rethrow(error);
            console.error("getAllCars: API unavailable", error);
            return [];
        }
    }
    return mockCars;
}

export async function getFeaturedCars(limit = 6): Promise<Car[]> {
    if (backendEnabled()) return softly("featured cars", async () => (await publicGet<Car[]>(`/web/cars/featured?limit=${limit}`)) ?? [], []);
    return mockCars.filter((car) => car.featured).slice(0, limit);
}

export async function getRecentCars(limit = 6): Promise<Car[]> {
    if (backendEnabled()) return softly("recent cars", async () => (await publicGet<Car[]>(`/web/cars/recent?limit=${limit}`)) ?? [], []);
    return [...mockCars].sort((a, b) => b.listedAt.localeCompare(a.listedAt)).slice(0, limit);
}

export async function getCar(id: string): Promise<Car | undefined> {
    // Always fresh: price and availability change, and the API counts the view.
    if (backendEnabled()) return /^[\w-]{1,64}$/.test(id) ? publicGet<Car>(`/web/cars/${id}`, { fresh: true }) : undefined;
    return mockCars.find((car) => car.id === id);
}

export async function getDealerCars(car: Car, limit = 6): Promise<Car[]> {
    if (backendEnabled()) return softly("dealer cars", async () => (await publicGet<Car[]>(`/web/cars/${car.id}/dealer-cars?limit=${limit}`)) ?? [], []);
    return mockCars.filter((item) => item.dealer.id === car.dealer.id && item.id !== car.id).slice(0, limit);
}

// Same body type first, then everything else.
export async function getSimilarCars(car: Car, limit = 6): Promise<Car[]> {
    if (backendEnabled()) return softly("similar cars", async () => (await publicGet<Car[]>(`/web/cars/${car.id}/similar?limit=${limit}`)) ?? [], []);
    const others = mockCars.filter((item) => item.id !== car.id);
    const sameType = others.filter((item) => item.bodyType === car.bodyType);
    return [...sameType, ...others.filter((item) => item.bodyType !== car.bodyType)].slice(0, limit);
}

export type PopularDealer = {
    dealer: Car["dealer"]
    count: number
}

// Dealers with the most stock of the same make and model.
export async function getPopularDealers(car: Car, limit = 3): Promise<PopularDealer[]> {
    if (backendEnabled()) return softly("popular dealers", async () => (await publicGet<PopularDealer[]>(`/web/cars/${car.id}/popular-dealers?limit=${limit}`)) ?? [], []);
    const counts = new Map<string, PopularDealer>();
    for (const item of mockCars.filter((item) => item.make === car.make && item.model === car.model)) {
        const entry = counts.get(item.dealer.id) ?? { dealer: item.dealer, count: 0 };
        entry.count++;
        counts.set(item.dealer.id, entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

// Average asking price of the same make and model, for the price comparison.
export async function getMarketPrice(car: Car): Promise<number | undefined> {
    if (backendEnabled()) return softly("market price", async () => (await publicGet<{ price: number | null }>(`/web/cars/${car.id}/market-price`))?.price ?? undefined, undefined);
    const others = mockCars.filter((item) => item.id !== car.id && item.make === car.make && item.model === car.model);
    return others.length ? others.reduce((sum, item) => sum + item.price, 0) / others.length : undefined;
}

const sorters: Record<SortKey, (a: Car, b: Car) => number> = {
    "recent": (a, b) => b.listedAt.localeCompare(a.listedAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "mileage-asc": (a, b) => a.mileage - b.mileage,
    "mileage-desc": (a, b) => b.mileage - a.mileage,
    "year-asc": (a, b) => a.year - b.year,
    "year-desc": (a, b) => b.year - a.year,
};

// Stand-in rules for the curated lists; the backend will own these.
const collections: Record<CarCollection, (car: Car) => boolean> = {
    "hot-sellers": (car) => car.featured,
    "student": (car) => car.price <= 200000,
    "cheap": (car) => car.price <= 150000,
    "bakkies": (car) => car.bodyType.includes("Bakkie") || car.bodyType === "Extended Cab",
    "exotics": (car) => car.category === "exotic",
    "classics": (car) => car.category === "classic",
    "leisure": (car) => car.category === "leisure",
};

const same = (a: string, b: string) => slugify(a) === slugify(b);

// A filter matches when it is empty or any of its comma-separated values matches.
function anyOf(value: string | undefined, actual: string, compare = (a: string, b: string) => a === b) {
    const values = filterValues(value);
    return values.length === 0 || values.some((item) => compare(actual, item));
}

function modelNameMatches(actual: string, title: string, requested: string) {
    const normalize = (value: string) => slugify(value).replace(/-class$/, "");
    const actualSlug = normalize(actual);
    const requestedSlug = normalize(requested);
    if (actualSlug === requestedSlug) return true;
    if (!requestedSlug.startsWith(`${actualSlug}-`)) return false;
    const extra = requestedSlug.slice(actualSlug.length + 1).split("-").filter((part) => part !== "series");
    const titleSlug = slugify(title);
    return extra.length > 0 && extra.every((part) => titleSlug.includes(part));
}

// Models are either plain ("corolla", applies to every chosen make) or tied to a make ("toyota:corolla").
function modelMatches(car: Car, model?: string) {
    const models = filterValues(model);
    if (models.length === 0) return true;
    const make = slugify(car.make);
    const mine = models.filter((item) => !item.includes(":") || item.startsWith(`${make}:`)).map((item) => item.split(":").pop()!);
    return mine.some((item) => modelNameMatches(car.model, car.title, item));
}

function variantMatches(car: Car, variant?: string) {
    const selectedVariants = filterValues(variant);
    if (selectedVariants.length === 0) return true;
    const variants = selectedVariants.filter((item) => {
        const [make] = item.split(":");
        return item.includes(":") ? make === slugify(car.make) : true;
    });
    if (!variants.length) return false;
    const title = slugify(car.title);
    return variants.some((item) => {
        const parts = item.split(":");
        const selected = parts.length > 2 ? parts.at(-1)! : item;
        return title.includes(slugify(selected));
    });
}

function matchesAdvanced(car: Car, search: CarSearch) {
    const engineCc = car.engineCc ?? (() => {
        const value = Number.parseFloat(car.engine);
        if (!Number.isFinite(value)) return undefined;
        return /l$/i.test(car.engine.trim()) ? value * 1000 : value;
    })();
    const selectedGroups = filterValues(search.vehicleGroup);
    const selectedSpecials = filterValues(search.specials).map((item) => slugify(item));
    const cylinderRanges: Record<string, [number, number]> = { "1-2": [1, 2], "3-5": [3, 5], "6-8": [6, 8], "10-12": [10, 12] };
    return (!selectedGroups.length || (!!car.vehicleGroup && selectedGroups.some((item) => same(car.vehicleGroup!, item)))) &&
        (!selectedSpecials.length || (car.isSpecial !== undefined && selectedSpecials.includes(car.isSpecial ? "on-special" : "not-on-special"))) &&
        (search.minEngine === undefined || (engineCc !== undefined && engineCc >= search.minEngine)) &&
        (search.maxEngine === undefined || (engineCc !== undefined && engineCc <= search.maxEngine)) &&
        (search.minKw === undefined || (car.powerKw !== undefined && car.powerKw >= search.minKw)) &&
        (search.maxKw === undefined || (car.powerKw !== undefined && car.powerKw <= search.maxKw)) &&
        (!search.seats || filterValues(search.seats).some((item) => item === "8+" ? car.seats !== undefined && car.seats >= 8 : car.seats !== undefined && car.seats === Number(item))) &&
        (!search.cylinders || filterValues(search.cylinders).some((item) => {
            const bounds = cylinderRanges[item];
            return !!bounds && car.cylinders !== undefined && car.cylinders >= bounds[0] && car.cylinders <= bounds[1];
        })) &&
        anyOf(search.dealership, car.dealer.name, same);
}

// API: GET /web/cars?<CarSearch fields> → { cars, total, page, pageCount }.
export async function searchCars(search: CarSearch): Promise<CarSearchResult<Car>> {
    if (backendEnabled()) {
        const result = await publicGet<CarSearchResult<Car>>(`/web/cars${queryString(search)}`, { revalidate: 30 });
        return result ?? { cars: [], total: 0, page: 1, pageCount: 1 };
    }
    const matches = mockCars.filter((car) =>
        (!search.q || car.title.toLowerCase().includes(search.q.trim().toLowerCase())) &&
        anyOf(search.make, car.make, same) &&
        modelMatches(car, search.model) &&
        variantMatches(car, search.variant) &&
        matchesAdvanced(car, search) &&
        (!search.collection || collections[search.collection](car)) &&
        anyOf(search.bodyType, car.bodyType) &&
        anyOf(search.fuel, car.fuel) &&
        anyOf(search.transmission, car.transmission) &&
        anyOf(search.drive, car.drive) &&
        anyOf(search.province, car.province, same) &&
        anyOf(search.colour, car.colour) &&
        (!search.minPrice || car.price >= search.minPrice) &&
        (!search.maxPrice || car.price <= search.maxPrice) &&
        (!search.minYear || car.year >= search.minYear) &&
        (!search.maxYear || car.year <= search.maxYear) &&
        (!search.minMileage || car.mileage >= search.minMileage) &&
        (!search.maxMileage || car.mileage <= search.maxMileage)
    ).sort(sorters[search.sort ?? "recent"]);

    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    const page = Math.min(search.page ?? 1, pageCount);
    return { cars: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: matches.length, page, pageCount };
}

export type CarCountResult = {
    total: number
    count: number
    formatted: string
}

export async function countCars(search: CarSearch): Promise<CarCountResult> {
    if (backendEnabled()) {
        const result = await softly("car count", async () => (await publicGet<CarCountResult>(`/web/cars/count${queryString(search)}`, { revalidate: 30 })), undefined);
        if (result) return result;
    }
    const result = await searchCars({ ...search, page: 1 });
    return {
        total: result.total,
        count: result.total,
        formatted: result.total.toLocaleString("en-US").replace(/,/g, " "),
    };
}

export async function getPremiumCars(limit = 12): Promise<Car[]> {
    if (backendEnabled()) return softly("premium cars", async () => (await publicGet<Car[]>(`/web/cars/premium?limit=${limit}`)) ?? [], []);
    return mockCars.filter((car) => car.featured).slice(0, limit);
}
