import type { Metadata } from "next";
import BuyingFilters from "../../Pages/BuyingFilters/BuyingFilters";
import { parseCarSearch } from "../../lib/cars/search";

export const metadata: Metadata = {
  title: "Find Your Dream Car | CHANGECARS",
};

// Filters for the general /search screen; the current search (e.g. the brand) stays applied.
export default async function Page({ searchParams }: PageProps<"/search/filters">) {
  const preset = parseCarSearch(await searchParams);
  return <BuyingFilters preset={preset} resultsPath="/search" presetInQuery />;
}
