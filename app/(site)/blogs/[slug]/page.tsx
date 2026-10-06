import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/app/Pages/ArticleDetail/ArticleDetail";
import { getArticle, getLatestArticles } from "@/app/lib/articles/api";

export async function generateMetadata({ params }: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | CHANGECARS`,
    description: article.excerpt ?? article.body.find((block) => block.type === "paragraph")?.text.slice(0, 160),
    openGraph: { title: article.title, images: [article.image] },
  };
}

export default async function Page({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const latest = (await getLatestArticles(6)).filter((item) => item.slug !== slug).slice(0, 5);
  return <ArticleDetail article={article} latest={latest} />;
}
