import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpecialDetail from "@/app/Pages/SpecialDetail/SpecialDetail";
import { getSpecial, getSpecials } from "@/app/lib/content/api";

// Specials are managed in the super admin console; ones added later are rendered on first visit.
export async function generateStaticParams() {
  return (await getSpecials()).map((special) => ({ slug: special.slug }));
}

export async function generateMetadata({ params }: PageProps<"/specials/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const special = await getSpecial(slug);
  if (!special) return {};
  return {
    title: `${special.title} Special | CHANGECARS`,
    description: special.text,
  };
}

export default async function Page({ params }: PageProps<"/specials/[slug]">) {
  const { slug } = await params;
  const special = await getSpecial(slug);
  if (!special) notFound();
  return <SpecialDetail special={special} />;
}
