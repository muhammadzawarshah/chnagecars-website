import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import InfoLayout from "@/app/components/InfoLayout";
import LogoImage from "@/app/components/LogoImage";
import { carSearchHref } from "@/app/lib/cars/search";
import { getDealerDirectory } from "@/app/lib/dealers/api";

export const metadata: Metadata = {
  title: "Our Dealers | CHANGECARS",
  description: "Find a CHANGECARS approved dealer near you and browse their stock.",
};

const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) || undefined;

export default async function Page({ searchParams }: PageProps<"/dealer-listing">) {
  const params = await searchParams;
  const q = one(params.q), province = PROVINCES.includes(one(params.province) ?? "") ? one(params.province) : undefined;
  const page = Math.max(1, Number(one(params.page)) || 1);
  const directory = await getDealerDirectory({ q, province, page });
  const href = (to: number) => `/dealer-listing?${new URLSearchParams({ ...(q ? { q } : {}), ...(province ? { province } : {}), page: String(to) })}`;
  const field = "h-11 rounded-[5px] border border-white/40 bg-white/95 px-4 font-sans text-sm text-[#2f2f2f] outline-none focus:border-gold";

  return (
    <InfoLayout title="Our" highlight="Dealers" intro="Approved dealerships across South Africa. Find one near you and browse their stock."
      actions={
        <Form action="" scroll={false} className="flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Search dealer name" aria-label="Search dealer name" maxLength={100} className={`${field} w-72 max-[600px]:w-full`} />
          <select name="province" defaultValue={province ?? ""} aria-label="Province" className={`${field} max-[600px]:w-full`}>
            <option value="">All provinces</option>
            {PROVINCES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button className="h-11 cursor-pointer rounded-[5px] border-0 bg-gold px-6 font-sans text-sm font-bold text-white">Search</button>
          {(q || province) && <Link href="/dealer-listing" scroll={false} className="flex h-11 items-center px-2 font-sans text-sm font-bold text-white underline">Clear</Link>}
        </Form>
      }>
      <p className="mt-0 mb-6 font-sans text-sm text-slate">{directory.total.toLocaleString("en-ZA")} dealer{directory.total === 1 ? "" : "s"}{province ? ` in ${province}` : ""}{q ? ` matching “${q}”` : ""}</p>
      {directory.dealers.length ? (
        <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[640px]:grid-cols-1">
          {directory.dealers.map((dealer) => (
            <article key={dealer.id} className="flex flex-col rounded-[10px] bg-cloud p-5 shadow-[5px_5px_5px_0px_rgba(0,0,0,0.149)]">
              <div className="flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                  <LogoImage src={dealer.logoUrl} name={dealer.name} className="h-full w-full object-contain" />
                </span>
                <div className="min-w-0">
                  <h2 className="m-0 line-clamp-2 font-sans text-base font-bold text-[#2f2f2f]">{dealer.name}</h2>
                  <p className="m-0 mt-1 font-sans text-xs text-slate">{[dealer.city, dealer.province].filter(Boolean).join(", ")}</p>
                </div>
              </div>
              {dealer.description && <p className="m-0 mt-4 line-clamp-3 font-sans text-sm leading-5.5 text-slate">{dealer.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 font-sans text-sm">
                <Link href={carSearchHref({ dealership: dealer.slug })} className="rounded-[5px] bg-gold px-4 py-2 font-bold text-white no-underline">View cars</Link>
                {dealer.phone && <a href={`tel:${dealer.phone.replace(/\s/g, "")}`} className="font-bold text-gold no-underline">{dealer.phone}</a>}
              </div>
            </article>
          ))}
        </div>
      ) : <p className="font-sans text-base text-slate">No dealers match this search.</p>}
      {directory.pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3 font-sans text-sm font-bold">
          {directory.page > 1 && <Link href={href(directory.page - 1)} scroll={false} className="rounded-[5px] border border-gold px-4 py-2 text-gold no-underline">Previous</Link>}
          <span className="px-2 text-slate">Page {directory.page} of {directory.pageCount}</span>
          {directory.page < directory.pageCount && <Link href={href(directory.page + 1)} scroll={false} className="rounded-[5px] bg-gold px-4 py-2 text-white no-underline">Next</Link>}
        </div>
      )}
    </InfoLayout>
  );
}
