import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BuyingResults from "../../Pages/BuyingResults/BuyingResults";
import { buyingCategories, buyingFiltersHref, buyingHref } from "../../Pages/BuyingFilters/Data/categories";
import { searchCars } from "../../lib/cars/api";
import { parseCarSearch } from "../../lib/cars/search";

export async function generateMetadata({ params }: PageProps<"/buying/[category]">): Promise<Metadata> {
  const { category } = await params;
  const match = buyingCategories.find((item) => item.slug === category);
  return { title: match ? `${match.label} For Sale | CHANGECARS` : "CHANGECARS" };
}

export default async function Page({ params, searchParams }: PageProps<"/buying/[category]">) {
  const { category } = await params;
  const match = buyingCategories.find((item) => item.slug === category);
  if (!match) notFound();
  const raw = await searchParams;
  const search = { ...parseCarSearch(raw), ...match.preset };
  const result = await searchCars(search);
  const query = new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))).toString();
  return <BuyingResults cars={result.cars} sort={search.sort ?? "recent"} query={query} resultsPath={buyingHref(match.slug)} filtersPath={buyingFiltersHref(match.slug)} />;
}
