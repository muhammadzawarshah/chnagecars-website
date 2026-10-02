import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BuyingFilters from "../../../Pages/BuyingFilters/BuyingFilters";
import { buyingCategories, buyingHref } from "../../../Pages/BuyingFilters/Data/categories";
import { parseCarSearch, searchFilters } from "../../../lib/cars/search";

export function generateStaticParams() {
  return buyingCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/buying/[category]/filters">): Promise<Metadata> {
  const { category } = await params;
  const match = buyingCategories.find((item) => item.slug === category);
  return { title: match ? `${match.label} | Find Your Dream Car | CHANGECARS` : "CHANGECARS" };
}

export default async function Page({ params, searchParams }: PageProps<"/buying/[category]/filters">) {
  const { category } = await params;
  const match = buyingCategories.find((item) => item.slug === category);
  if (!match) notFound();
  return <BuyingFilters preset={match.preset} initial={searchFilters(parseCarSearch(await searchParams))} resultsPath={buyingHref(match.slug)} />;
}
