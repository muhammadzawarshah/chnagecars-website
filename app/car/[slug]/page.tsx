import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CarDetail from "../../Pages/CarDetail/CarDetail";
import { getAllCars, getCar, getMarketPrice, getPopularDealers, getSimilarCars } from "../../lib/cars/api";
import { getLatestArticles } from "../../lib/articles/api";
import { carHref, carSlug, formatRand, idFromSlug } from "../../lib/cars/format";

export async function generateStaticParams() {
  const cars = await getAllCars();
  return cars.map((car) => ({ slug: carSlug(car) }));
}

export async function generateMetadata({ params }: PageProps<"/car/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCar(idFromSlug(slug));
  if (!car) return {};
  return {
    title: `${car.title} for Sale | ${formatRand(car.price)} | CHANGECARS`,
    description: `${car.title} for sale in ${car.location} at ${car.dealer.name}.`,
  };
}

export default async function Page({ params }: PageProps<"/car/[slug]">) {
  const { slug } = await params;
  const car = await getCar(idFromSlug(slug));
  if (!car) notFound();
  // Old or edited titles in the URL still work, but land on the one correct address.
  if (slug !== carSlug(car)) permanentRedirect(carHref(car));

  const [similarCars, articles, dealers, marketPrice] = await Promise.all([getSimilarCars(car), getLatestArticles(3), getPopularDealers(car), getMarketPrice(car)]);
  return <CarDetail car={car} similarCars={similarCars} articles={articles} dealers={dealers} marketPrice={marketPrice} />;
}
