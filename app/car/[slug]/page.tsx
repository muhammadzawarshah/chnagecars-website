import { notFound } from "next/navigation";
import CarDetail from "../../Pages/CarDetail/CarDetail";
import { allCars, carSlug, findCar } from "../../Pages/Home/Data/cars";

export function generateStaticParams() {
  return allCars.map((car) => ({ slug: carSlug(car) }));
}

export default async function Page({ params }: PageProps<"/car/[slug]">) {
  const { slug } = await params;
  const car = findCar(slug);
  if (!car) notFound();
  return <CarDetail car={car} />;
}
