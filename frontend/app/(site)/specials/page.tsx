import type { Metadata } from "next";
import Link from "next/link";
import InfoLayout from "@/app/components/InfoLayout";
import { getSpecials } from "@/app/lib/content/api";

export const metadata: Metadata = {
  title: "Specials | CHANGECARS",
  description: "Current vehicle specials and promotions from CHANGECARS dealers.",
};

export default async function Page() {
  const specials = await getSpecials();
  return (
    <InfoLayout title="Our" highlight="Specials" intro="As a customer you are special to us! Here are our specials for you.">
      {specials.length ? (
        <div className="grid grid-cols-4 gap-7.5 max-[1100px]:grid-cols-3 max-[745px]:grid-cols-2 max-[480px]:grid-cols-1">
          {specials.map((special) => (
            <Link key={special.slug} href={special.href} className="group block overflow-hidden rounded-[10px] no-underline shadow-[5px_5px_5px_0px_rgba(0,0,0,0.149)]">
              <div role="img" aria-label={special.title} className="aspect-[342.5/337] w-full bg-white bg-cover bg-center bg-no-repeat transition group-hover:opacity-90" style={{ backgroundImage: `url(${special.image})` }}></div>
              <h2 className="m-0 line-clamp-1 bg-gold px-2.5 text-center text-base leading-8.75 font-bold text-white uppercase">{special.title}</h2>
              {special.text && <p className="m-0 line-clamp-2 bg-cloud px-3 py-2.5 text-center font-sans text-sm leading-5 text-slate">{special.text}</p>}
            </Link>
          ))}
        </div>
      ) : <p className="font-sans text-base text-slate">There are no specials running right now. Please check back soon.</p>}
    </InfoLayout>
  );
}
