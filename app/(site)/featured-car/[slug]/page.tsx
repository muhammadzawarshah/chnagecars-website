import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import FeaturedCarDetail from "@/app/Pages/FeaturedCarDetail/FeaturedCarDetail";
import { getAllCars, getCar, getDealerCars, getSimilarCars } from "@/app/lib/cars/api";
import { carSlug, featuredCarHref, formatRand, idFromSlug } from "@/app/lib/cars/format";

export async function generateStaticParams() {
  const cars = await getAllCars();
  return cars.map((car) => ({ slug: carSlug(car) }));
}

export async function generateMetadata({ params }: PageProps<"/featured-car/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCar(idFromSlug(slug));
  if (!car) return {};
  return {
    title: `${car.title} for Sale | ${formatRand(car.price)} | CHANGECARS`,
    description: `${car.title} for sale in ${car.location} at ${car.dealer.name}.`,
  };
}

export default async function Page({ params }: PageProps<"/featured-car/[slug]">) {
  const { slug } = await params;
  const car = await getCar(idFromSlug(slug));
  if (!car) notFound();
  // Old or edited titles in the URL still work, but land on the one correct address.
  if (slug !== carSlug(car)) permanentRedirect(featuredCarHref(car));

  const [dealerCars, similarCars] = await Promise.all([getDealerCars(car), getSimilarCars(car)]);
  return <FeaturedCarDetail car={car} dealerCars={dealerCars} similarCars={similarCars} />;
}
