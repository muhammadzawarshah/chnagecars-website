import { Car } from "./types"
import { mockCars } from "./mockCars"
import { CarCollection, CarSearch, CarSearchResult, PAGE_SIZE, SortKey, slugify } from "./search"

// Every page gets car listings from here. When the backend is ready, replace each
// function body with a fetch to the matching endpoint; pages and components stay the same.
// e.g. getFeaturedCars → fetch(`${process.env.API_URL}/cars?featured=true&limit=${limit}`)

export async function getAllCars(): Promise<Car[]> {
    return mockCars;
}

export async function getFeaturedCars(limit = 6): Promise<Car[]> {
    return mockCars.filter((car) => car.featured).slice(0, limit);
}

export async function getRecentCars(limit = 6): Promise<Car[]> {
    return [...mockCars].sort((a, b) => b.listedAt.localeCompare(a.listedAt)).slice(0, limit);
}

export async function getCar(id: string): Promise<Car | undefined> {
    return mockCars.find((car) => car.id === id);
}

export async function getDealerCars(car: Car, limit = 6): Promise<Car[]> {
    return mockCars.filter((item) => item.dealer.id === car.dealer.id && item.id !== car.id).slice(0, limit);
}

// Same body type first, then everything else.
export async function getSimilarCars(car: Car, limit = 6): Promise<Car[]> {
    const others = mockCars.filter((item) => item.id !== car.id);
    const sameType = others.filter((item) => item.bodyType === car.bodyType);
    return [...sameType, ...others.filter((item) => item.bodyType !== car.bodyType)].slice(0, limit);
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

// Backend: GET /cars?<CarSearch fields> → { cars, total }.
export async function searchCars(search: CarSearch): Promise<CarSearchResult<Car>> {
    const matches = mockCars.filter((car) =>
        (!search.make || same(car.make, search.make)) &&
        (!search.model || same(car.model, search.model)) &&
        (!search.collection || collections[search.collection](car)) &&
        (!search.bodyType || car.bodyType === search.bodyType) &&
        (!search.fuel || car.fuel === search.fuel) &&
        (!search.transmission || car.transmission === search.transmission) &&
        (!search.drive || car.drive === search.drive) &&
        (!search.province || same(car.province, search.province)) &&
        (!search.colour || car.colour === search.colour) &&
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

export async function getPremiumCars(limit = 12): Promise<Car[]> {
    return mockCars.filter((car) => car.featured).slice(0, limit);
}
