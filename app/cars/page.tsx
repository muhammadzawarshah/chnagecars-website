import type { Metadata } from "next";
import CarListing from "../Pages/CarListing/CarListing";
import { getPremiumCars, searchCars } from "../lib/cars/api";
import { parseCarSearch } from "../lib/cars/search";

export const metadata: Metadata = {
  title: "New & Used Cars For Sale | CHANGECARS",
  description: "Search new and used cars for sale in South Africa from franchised approved dealers.",
};

export default async function Page({ searchParams }: PageProps<"/cars">) {
  const search = parseCarSearch(await searchParams);
  const [result, premium, all] = await Promise.all([searchCars(search), getPremiumCars(), searchCars({})]);
  return <CarListing search={search} result={result} premium={premium} inventory={all.total} />;
}
