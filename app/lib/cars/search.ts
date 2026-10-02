
// One definition of a car search, shared by the URL (/cars?...), the filter form
// and the API. The backend search endpoint should accept these same fields.

export type SortKey = "recent" | "price-asc" | "price-desc" | "mileage-asc" | "mileage-desc" | "year-asc" | "year-desc"

// Curated lists the live site has its own pages for (Hot sellers, Bakkies…).
// The backend decides which cars belong to each one.
export type CarCollection = "hot-sellers" | "student" | "bakkies" | "cheap" | "exotics" | "classics" | "leisure"

export const collectionTitles: Record<CarCollection, string> = {
    "hot-sellers": "Hot Sellers",
    "student": "Student Cars",
    "bakkies": "Bakkies For Sale",
    "cheap": "Cheap Cars For Sale",
    "exotics": "Exotic Cars For Sale",
    "classics": "Classic Cars For Sale",
    "leisure": "Leisure Vehicles For Sale",
};

// Text filters may hold several comma-separated values (any of them matches),
// e.g. fuel=Diesel,Petrol. A model may be tied to its make: model=toyota:corolla.
export type CarSearch = {
    make?: string
    model?: string
    bodyType?: string
    fuel?: string
    transmission?: string
    drive?: string
    province?: string
    colour?: string
    collection?: CarCollection
    minPrice?: number
    maxPrice?: number
    minYear?: number
    maxYear?: number
    minMileage?: number
    maxMileage?: number
    sort?: SortKey
    page?: number
}

export type CarSearchResult<T> = {
    cars: T[]
    total: number
    page: number
    pageCount: number
}

export const PAGE_SIZE = 20;

export const sortOptions: { value: SortKey, label: string }[] = [
    { value: "recent", label: "Most Recent" },
    { value: "price-asc", label: "Price low to high" },
    { value: "price-desc", label: "Price high to low" },
    { value: "mileage-asc", label: "Mileage low to high" },
    { value: "mileage-desc", label: "Mileage high to low" },
    { value: "year-asc", label: "Oldest to newest" },
    { value: "year-desc", label: "Newest to oldest" },
];

const textKeys = ["make", "model", "bodyType", "fuel", "transmission", "drive", "province", "colour", "collection", "sort"] as const;
const numberKeys = ["minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage", "page"] as const;

type RawParams = Record<string, string | string[] | undefined>

// Reads /cars?... into a CarSearch, ignoring anything unknown or malformed.
export function parseCarSearch(params: RawParams): CarSearch {
    const search: Record<string, string | number> = {};
    const read = (key: string) => {
        const value = params[key];
        return Array.isArray(value) ? value[0] : value;
    };
    for (const key of textKeys) {
        const value = read(key)?.trim();
        if (value) search[key] = value;
    }
    for (const key of numberKeys) {
        const value = Number(read(key));
        if (Number.isFinite(value) && value > 0) search[key] = value;
    }
    if (search.sort && !sortOptions.some((option) => option.value === search.sort)) delete search.sort;
    if (search.collection && !(search.collection in collectionTitles)) delete search.collection;
    return search as CarSearch;
}

export function carSearchHref(search: CarSearch) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
        if (value !== undefined && value !== "" && !(key === "page" && value === 1) && !(key === "sort" && value === "recent")) {
            query.set(key, String(value));
        }
    }
    const text = query.toString();
    return text ? `/cars?${text}` : "/cars";
}

// Same search on the app-style "Search" screen.
export function appSearchHref(search: CarSearch) {
    return carSearchHref(search).replace(/^\/cars/, "/search");
}

// The filters of a search without its paging and sort order (what the filter form edits).
export function searchFilters(search: CarSearch): CarSearch {
    const filters = { ...search };
    delete filters.sort;
    delete filters.page;
    return filters;
}

// Splits a comma-separated filter value.
export function filterValues(value?: string) {
    return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function slugify(value: string) {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
