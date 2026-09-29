// Shape of an article as the backend will send it.

export type ArticleCategory = {
    slug: string
    name: string
}

// Article text arrives as blocks, so the page renders it without injecting raw HTML.
export type ArticleBlock =
    | { type: "paragraph", text: string }
    | { type: "heading", text: string }
    | { type: "image", src: string, alt?: string }
    | { type: "link", text: string, href: string }

export type Article = {
    slug: string
    title: string
    publishedAt: string
    category: string
    image: string
    excerpt?: string
    body: ArticleBlock[]
    featured?: boolean
}

export type ArticleSearch = {
    q?: string
    category?: string
    page?: number
}

export type ArticleSearchResult = {
    articles: Article[]
    total: number
    page: number
    pageCount: number
}
