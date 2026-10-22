import { notFound } from "next/navigation"
import { ConsoleQuery, consoleGet, list, PageData, paginationQuery, queryValue, record, Row, text } from "@/app/lib/dashboard/console"
import type { BlogBlock } from "@/app/lib/dashboard/blog-actions"
import BlogEditor from "./BlogEditor"
import BlogDetail from "./BlogDetail"
import BlogsList, { BlogCategory } from "./BlogsList"

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"]

async function categories(): Promise<BlogCategory[]> {
    return list(await consoleGet<Row[]>("/content/article-categories")).map((row) => ({ id: text(row.id), name: text(row.name), slug: text(row.slug) }))
}

export async function BlogsPage({ query }: { query: ConsoleQuery }) {
    const status = STATUSES.includes(queryValue(query, "status")) ? queryValue(query, "status") : ""
    const category = queryValue(query, "category").slice(0, 80)
    const count = (value: string) => consoleGet<PageData>(`/admin/articles?pageSize=1${value ? `&status=${value}` : ""}`).then((page) => page.meta.total)
    const [page, cats, total, published, drafts, archived] = await Promise.all([
        consoleGet<PageData>("/admin/articles" + paginationQuery(query, { ...(status ? { status } : {}), ...(category ? { category } : {}) })),
        categories(), count(""), count("PUBLISHED"), count("DRAFT"), count("ARCHIVED"),
    ])
    const names = new Map(cats.map((item) => [item.id, item.name]))
    const rows = page.data.map((row) => ({
        id: text(row.id), title: text(row.title), slug: text(row.slug), status: text(row.status), type: text(row.type),
        featured: row.featured === true, coverImageUrl: text(row.coverImageUrl), category: names.get(text(row.categoryId)) ?? "",
        publishedAt: text(row.publishedAt), updatedAt: text(row.updatedAt),
    }))
    return <BlogsList rows={rows} meta={page.meta} counts={{ total, published, drafts, archived }} categories={cats} filters={{ status, q: queryValue(query, "q"), category }} />
}

export async function BlogEditPage({ id, justCreated = false }: { id?: string, justCreated?: boolean }) {
    if (id === undefined) return <BlogEditor initial={null} categories={await categories()} />
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
    const [row, cats] = await Promise.all([consoleGet<Row>(`/admin/articles/${id}`), categories()])
    const initial = {
        id: text(row.id), title: text(row.title), slug: text(row.slug), excerpt: text(row.excerpt), coverImageUrl: text(row.coverImageUrl),
        categoryId: text(row.categoryId), type: text(row.type), tags: Array.isArray(row.tags) ? row.tags.map(text).filter(Boolean) : [],
        featured: row.featured === true, metaTitle: text(row.metaTitle), metaDescription: text(row.metaDescription),
        body: (Array.isArray(row.body) ? row.body : []).map(record) as unknown as BlogBlock[], status: text(row.status), updatedAt: text(row.updatedAt),
    }
    return <BlogDetail blog={initial} categories={cats} justCreated={justCreated} />
}
