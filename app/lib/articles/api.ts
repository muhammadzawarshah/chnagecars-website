import { Article, ArticleCategory, ArticleSearch, ArticleSearchResult } from "./types"
import { mockArticles, mockCategories } from "./mockArticles"

// Every page gets articles from here. When the backend is ready, replace each function
// body with a fetch to the matching endpoint; pages and components stay the same.
// e.g. searchArticles → fetch(`${process.env.API_URL}/articles?q=…&category=…&page=…`)

export const ARTICLES_PAGE_SIZE = 24;

const newestFirst = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);

export async function getArticleCategories(): Promise<ArticleCategory[]> {
    return mockCategories;
}

export async function getFeaturedArticle(): Promise<Article | undefined> {
    return mockArticles.find((article) => article.featured);
}

export async function getLatestArticles(limit = 4): Promise<Article[]> {
    return mockArticles.filter((article) => !article.featured).sort(newestFirst).slice(0, limit);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
    return mockArticles.find((article) => article.slug === slug);
}

// Backend: GET /articles?q=&category=&page= → { articles, total }.
// The featured article is shown separately, so it is left out of the list.
export async function searchArticles(search: ArticleSearch): Promise<ArticleSearchResult> {
    const q = search.q?.trim().toLowerCase();
    const matches = mockArticles
        .filter((article) => !article.featured || q || search.category)
        .filter((article) => !q || article.title.toLowerCase().includes(q))
        .filter((article) => !search.category || article.category === search.category)
        .sort(newestFirst);

    const pageCount = Math.max(1, Math.ceil(matches.length / ARTICLES_PAGE_SIZE));
    const page = Math.min(search.page ?? 1, pageCount);
    return { articles: matches.slice((page - 1) * ARTICLES_PAGE_SIZE, page * ARTICLES_PAGE_SIZE), total: matches.length, page, pageCount };
}
