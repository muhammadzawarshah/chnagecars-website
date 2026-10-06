import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FeaturedDealer from "@/app/Pages/FeaturedDealer/FeaturedDealer";
import { dealers } from "@/app/Pages/Home/Data/dealers";
import { getAllCars } from "@/app/lib/cars/api";

export function generateStaticParams() {
  return dealers.map((dealer) => ({ slug: dealer.slug }));
}

export async function generateMetadata({ params }: PageProps<"/featured-dealer/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dealer = dealers.find((item) => item.slug === slug);
  if (!dealer) return {};
  return {
    title: `${dealer.name} | Featured Dealer | CHANGECARS`,
    description: dealer.description,
  };
}

export default async function Page({ params }: PageProps<"/featured-dealer/[slug]">) {
  const { slug } = await params;
  const dealer = dealers.find((item) => item.slug === slug);
  if (!dealer) notFound();
  // Backend: replace with this dealer's own stock.
  const cars = await getAllCars();
  return <FeaturedDealer dealer={dealer} cars={cars} />;
}
