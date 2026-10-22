import { Article, ArticleCategory, ArticleSearch, ArticleSearchResult } from "./types"
import { mockArticles, mockCategories } from "./mockArticles"
import { backendEnabled, publicGet, queryString, softly } from "../backend/client"

// Every page gets articles from here. With API_URL set, each function reads the
// ChangeCars API (backend/src/modules/web, same shapes as ./types); without it the
// sample data below is used. Pages and components stay the same either way.

export const ARTICLES_PAGE_SIZE = 24;

const newestFirst = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);

export async function getArticleCategories(): Promise<ArticleCategory[]> {
    if (backendEnabled()) return softly("article categories", async () => (await publicGet<ArticleCategory[]>("/web/article-categories", { revalidate: 300 })) ?? [], []);
    return mockCategories;
}

export async function getFeaturedArticle(): Promise<Article | undefined> {
    if (backendEnabled()) return softly("featured article", async () => (await publicGet<{ article: Article | null }>("/web/articles/featured"))?.article ?? undefined, undefined);
    return mockArticles.find((article) => article.featured);
}

export async function getLatestArticles(limit = 4): Promise<Article[]> {
    if (backendEnabled()) return softly("latest articles", async () => (await publicGet<Article[]>(`/web/articles/latest?limit=${limit}`)) ?? [], []);
    return mockArticles.filter((article) => !article.featured).sort(newestFirst).slice(0, limit);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
    if (backendEnabled()) return /^[\w-]{1,200}$/.test(slug) ? publicGet<Article>(`/web/articles/${slug}`) : undefined;
    return mockArticles.find((article) => article.slug === slug);
}

// API: GET /web/articles?q=&category=&page= → { articles, total, page, pageCount }.
// The featured article is shown separately, so it is left out of the list.
export async function searchArticles(search: ArticleSearch): Promise<ArticleSearchResult> {
    if (backendEnabled()) {
        const result = await publicGet<ArticleSearchResult>(`/web/articles${queryString({ q: search.q, category: search.category, page: search.page })}`);
        return result ?? { articles: [], total: 0, page: 1, pageCount: 1 };
    }
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
