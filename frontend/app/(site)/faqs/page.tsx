import type { Metadata } from "next";
import InfoLayout from "@/app/components/InfoLayout";
import { getFaqs } from "@/app/lib/content/api";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | CHANGECARS",
  description: "Answers to common questions about buying, selling and finance on CHANGECARS.",
};

const label = (category: string) => category.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function Page() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((faq) => faq.category ?? ""))].map((category) => ({ category, items: faqs.filter((faq) => (faq.category ?? "") === category) }));
  return (
    <InfoLayout title="Frequently Asked" highlight="Questions" intro="Answers to the questions we hear most.">
      {faqs.length ? (
        <div className="grid max-w-215 gap-10">
          {groups.map(({ category, items }) => (
            <section key={category || "general"}>
              {groups.length > 1 && <h2 className="m-0 mb-4 font-sans text-2xl font-black text-[#2f2f2f]">{category ? label(category) : "General"}</h2>}
              <div className="grid gap-3">
                {items.map((faq) => (
                  <details key={faq.id} className="group rounded-[10px] border border-[#e2ddd3] bg-white px-5 py-4 open:bg-[#faf6ec]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-base font-bold text-[#2f2f2f]">
                      {faq.question}
                      <span aria-hidden="true" className="text-xl text-gold transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="m-0 mt-3 font-sans text-base leading-7 whitespace-pre-line text-slate">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : <p className="font-sans text-base text-slate">Questions and answers will appear here soon.</p>}
    </InfoLayout>
  );
}
