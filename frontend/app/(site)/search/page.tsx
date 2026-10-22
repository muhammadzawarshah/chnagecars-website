import type { Metadata } from "next";
import BuyingResults from "@/app/Pages/BuyingResults/BuyingResults";
import { searchCars } from "@/app/lib/cars/api";
import { parseCarSearch } from "@/app/lib/cars/search";

export const metadata: Metadata = {
  title: "Search Cars | CHANGECARS",
  description: "Search new and used cars for sale in South Africa.",
};

// App-style "Search" screen for any filter set, e.g. a brand card: /search?make=bmw
export default async function Page({ searchParams }: PageProps<"/search">) {
  const raw = await searchParams;
  const search = parseCarSearch(raw);
  const result = await searchCars(search);
  const params = new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : [])));
  const query = params.toString();
  params.delete("sort");
  params.delete("page");
  const filters = params.toString();
  return <BuyingResults cars={result.cars} sort={search.sort ?? "recent"} page={result.page} pageCount={result.pageCount} total={result.total} query={query} resultsPath="/search" filtersPath={filters ? `/search/filters?${filters}` : "/search/filters"} />;
}
