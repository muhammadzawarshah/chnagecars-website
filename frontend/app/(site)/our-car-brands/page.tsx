import type { Metadata } from "next";
import Link from "next/link";
import InfoLayout from "@/app/components/InfoLayout";
import { carSearchHref } from "@/app/lib/cars/search";
import { getMakes } from "@/app/lib/dealers/api";
import { carBrands } from "@/app/Pages/Home/Data/brands";

export const metadata: Metadata = {
  title: "Our Car Brands | CHANGECARS",
  description: "Browse new and used cars for sale by brand.",
};

const logos = new Map(carBrands.map((brand) => [brand.name.toLowerCase(), brand.logo]));

export default async function Page() {
  const makes = await getMakes();
  const letters = [...new Set(makes.map((make) => make.name[0].toUpperCase()))].sort();
  return (
    <InfoLayout title="Our Car" highlight="Brands" intro="Pick a brand to see every car we have for sale.">
      {makes.length ? (
        <div className="grid gap-10">
          {letters.map((letter) => (
            <section key={letter}>
              <h2 className="m-0 mb-4 border-b border-[#e2ddd3] pb-2 font-sans text-2xl font-black text-gold">{letter}</h2>
              <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-4 max-[700px]:grid-cols-3 max-[450px]:grid-cols-2">
                {makes.filter((make) => make.name[0].toUpperCase() === letter).map((make) => {
                  const logo = make.logoUrl || logos.get(make.name.toLowerCase());
                  return (
                    <Link key={make.id} href={carSearchHref({ make: make.slug })} className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e2ddd3] bg-white px-3 py-4 text-center no-underline transition hover:border-gold">
                      {logo ? <img src={logo} alt="" className="h-12 w-full object-contain" /> : <span className="flex size-12 items-center justify-center rounded-full bg-cloud font-sans text-lg font-black text-gold">{make.name[0]}</span>}
                      <span className="font-sans text-sm font-bold text-[#2f2f2f]">{make.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : <p className="font-sans text-base text-slate">Brands will appear here soon.</p>}
    </InfoLayout>
  );
}
