import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FeaturedDealer from "@/app/Pages/FeaturedDealer/FeaturedDealer";
import { getFeaturedDealer, getFeaturedDealers } from "@/app/lib/content/api";
import { getAllCars, getDealerStock } from "@/app/lib/cars/api";

// Featured dealers are managed in the super admin console; ones added later are rendered on first visit.
export async function generateStaticParams() {
  return (await getFeaturedDealers()).map((dealer) => ({ slug: dealer.slug }));
}

export async function generateMetadata({ params }: PageProps<"/featured-dealer/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await getFeaturedDealer(slug);
  if (!dealer) return {};
  return {
    title: `${dealer.name} | Featured Dealer | CHANGECARS`,
    description: dealer.description,
  };
}

export default async function Page({ params }: PageProps<"/featured-dealer/[slug]">) {
  const { slug } = await params;
  const dealer = await getFeaturedDealer(slug);
  if (!dealer) notFound();
  // A featured dealer linked to its marketplace dealer shows that dealer's stock; an unlinked one keeps the general list.
  const cars = dealer.dealerId ? await getDealerStock(dealer.dealerId) : await getAllCars();
  return <FeaturedDealer dealer={dealer} cars={cars} />;
}
