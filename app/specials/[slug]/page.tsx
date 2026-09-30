import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpecialDetail from "../../Pages/SpecialDetail/SpecialDetail";
import { specials } from "../../Pages/Home/Data/blocks";

export function generateStaticParams() {
  return specials.map((special) => ({ slug: special.slug }));
}

export async function generateMetadata({ params }: PageProps<"/specials/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const special = specials.find((item) => item.slug === slug);
  if (!special) return {};
  return {
    title: `${special.title} Special | CHANGECARS`,
    description: special.text,
  };
}

export default async function Page({ params }: PageProps<"/specials/[slug]">) {
  const { slug } = await params;
  const special = specials.find((item) => item.slug === slug);
  if (!special) notFound();
  return <SpecialDetail special={special} />;
}
