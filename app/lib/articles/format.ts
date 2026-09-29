import { Article, ArticleSearch } from "./types"

type RawParams = Record<string, string | string[] | undefined>

export const ARTICLES_PATH = "/motoring-news";

export function articleHref(article: Article) {
    return `/blogs/${article.slug}`;
}

// "2026-09-28" → "September 28, 2026". Fixed to UTC so server and browser agree.
export function formatArticleDate(iso: string) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function parseArticleSearch(params: RawParams): ArticleSearch {
    const read = (key: string) => {
        const value = params[key];
        return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
    };
    const page = Number(read("page"));
    return { q: read("q"), category: read("category"), page: Number.isFinite(page) && page > 1 ? page : undefined };
}

export function articleSearchHref(search: ArticleSearch) {
    const query = new URLSearchParams();
    if (search.q) query.set("q", search.q);
    if (search.category) query.set("category", search.category);
    if (search.page && search.page > 1) query.set("page", String(search.page));
    const text = query.toString();
    return text ? `${ARTICLES_PATH}?${text}` : ARTICLES_PATH;
}
