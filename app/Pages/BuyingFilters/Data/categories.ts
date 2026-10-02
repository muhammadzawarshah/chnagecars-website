import { CarSearch } from "@/app/lib/cars/search"

export type BuyingCategory = {
    slug: string
    label: string
    preset: CarSearch
}

// The header "Buying" links (except Specials), each opening the app's filter screen for that category.
export const buyingCategories: BuyingCategory[] = [
    { slug: "bakkies", label: "Bakkies", preset: { collection: "bakkies" } },
    { slug: "cheap-cars", label: "Cheap Cars", preset: { collection: "cheap" } },
    { slug: "classics", label: "Classics", preset: { collection: "classics" } },
    { slug: "exotics", label: "Exotics", preset: { collection: "exotics" } },
    { slug: "hot-sellers", label: "Hot Sellers", preset: { collection: "hot-sellers" } },
    { slug: "leisure", label: "Leisure", preset: { collection: "leisure" } },
    { slug: "motorbikes", label: "Motorbikes", preset: { bodyType: "Motorbike" } },
    { slug: "student-cars", label: "Student Cars", preset: { collection: "student" } },
];

// The Buying links open the app's "Search" results screen; its Filters button opens the filter form.
export function buyingHref(slug: string) {
    return `/buying/${slug}`;
}

export function buyingFiltersHref(slug: string) {
    return `/buying/${slug}/filters`;
}

// Results screen with the chosen filters as a query string.
export function buyingResultsHref(slug: string, query = "") {
    return `/buying/${slug}${query ? `?${query}` : ""}`;
}
