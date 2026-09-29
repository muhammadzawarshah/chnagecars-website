import type { Metadata } from "next";
import Articles from "../Pages/Articles/Articles";
import { getArticleCategories, getFeaturedArticle, searchArticles } from "../lib/articles/api";
import { parseArticleSearch } from "../lib/articles/format";

export const metadata: Metadata = {
  title: "Motoring News, Car Reviews & Advice | CHANGECARS",
  description: "Catch up on all the latest happenings in the motoring world: news, road reviews, launches and advice.",
};

export default async function Page({ searchParams }: PageProps<"/motoring-news">) {
  const search = parseArticleSearch(await searchParams);
  const [result, featured, categories] = await Promise.all([searchArticles(search), getFeaturedArticle(), getArticleCategories()]);
  return <Articles search={search} result={result} featured={featured} categories={categories} />;
}
