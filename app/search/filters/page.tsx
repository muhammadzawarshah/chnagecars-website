import type { Metadata } from "next";
import BuyingFilters from "../../Pages/BuyingFilters/BuyingFilters";
import { parseCarSearch, searchFilters } from "../../lib/cars/search";

export const metadata: Metadata = {
  title: "Find Your Dream Car | CHANGECARS",
};

// Filters for the general /search screen. The form opens with the current filters filled in (so Reset clears them);
// a curated list such as Hot Sellers stays applied.
export default async function Page({ searchParams }: PageProps<"/search/filters">) {
  const { collection, ...current } = searchFilters(parseCarSearch(await searchParams));
  return <BuyingFilters preset={collection ? { collection } : {}} initial={current} resultsPath="/search" presetInQuery />;
}
