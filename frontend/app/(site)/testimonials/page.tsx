import type { Metadata } from "next";
import InfoLayout from "@/app/components/InfoLayout";
import { getTestimonials } from "@/app/lib/content/api";

export const metadata: Metadata = {
  title: "Testimonials | CHANGECARS",
  description: "What our customers say about buying and selling with CHANGECARS.",
};

export default async function Page() {
  const testimonials = await getTestimonials();
  return (
    <InfoLayout title="Customer" highlight="Testimonials" intro="Where satisfaction meets success.">
      {testimonials.length ? (
        <div className="columns-3 gap-7.5 max-[1000px]:columns-2 max-[640px]:columns-1">
          {testimonials.map((item, index) => (
            <article key={`${item.name}-${index}`} className="mb-7.5 break-inside-avoid rounded-[10px] bg-cloud px-5 pt-5 pb-6 shadow-[5px_5px_5px_0px_rgba(0,0,0,0.149)]">
              <h2 className="m-0 text-left text-lg leading-6 font-bold text-slate uppercase wrap-anywhere">{item.name}</h2>
              <img src="/img/testimonials-five-stars.svg" alt="Five stars" className="mt-3 mb-2 inline h-5 max-w-full" />
              <p className="m-0 font-sans text-sm leading-6.5 whitespace-pre-line text-slate">{item.text}</p>
            </article>
          ))}
        </div>
      ) : <p className="font-sans text-base text-slate">Testimonials will appear here soon.</p>}
    </InfoLayout>
  );
}
