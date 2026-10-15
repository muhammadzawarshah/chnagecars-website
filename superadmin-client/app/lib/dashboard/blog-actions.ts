"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { BackendError } from "../backend/client"
import { consoleWrite, requireSuperAdmin, text } from "./console"

export type BlogBlock =
    | { type: "paragraph" | "quote", text: string }
    | { type: "heading", text: string, level: 2 | 3 | 4 }
    | { type: "list", items: string[] }
    | { type: "image", src: string, alt?: string }
    | { type: "link", text: string, href: string }
    | { type: "video", url: string }

export type BlogInput = {
    id?: string
    title: string
    slug: string
    excerpt: string
    coverImageUrl: string
    categoryId: string
    type: string
    tags: string[]
    featured: boolean
    metaTitle: string
    metaDescription: string
    body: BlogBlock[]
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    previousStatus?: string
}

export type BlogResult = { id?: string, error?: string, success?: string }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"]
const TYPES = ["NEWS", "REVIEW", "ADVICE", "GUIDE", "ARTICLE"]

function failure(error: unknown): BlogResult {
    if (error instanceof BackendError || (error instanceof Error && !("digest" in error))) return { error: error.message }
    throw error
}

// The website caches article data under the "articles" tag; expire it so the blog shows the change on the next visit.
function refresh() {
    revalidateTag("articles", { expire: 0 })
    revalidatePath("/dashboard/super-admin/blogs", "layout")
}

/** Creates or updates a blog, then applies the chosen status (publish, unpublish, archive). */
export async function saveBlog(input: BlogInput): Promise<BlogResult> {
    await requireSuperAdmin()
    try {
        if (input.id && !uuid.test(input.id)) throw new Error("Invalid blog")
        if (!STATUSES.includes(input.status)) throw new Error("Choose a valid status")
        const title = input.title.trim()
        if (title.length < 3 || title.length > 200) throw new Error("The title needs 3 to 200 characters")
        // Empty blocks are dropped rather than refused, so a half-written block does not block saving.
        const body = input.body.filter((block) => {
            switch (block.type) {
                case "list": return block.items.some((item) => item.trim())
                case "image": return !!block.src.trim()
                case "video": return !!block.url.trim()
                case "link": return !!block.text.trim() && !!block.href.trim()
                default: return !!block.text.trim()
            }
        }).map((block) => block.type === "list" ? { ...block, items: block.items.map((item) => item.trim()).filter(Boolean) } : block)
        if (input.status === "PUBLISHED" && !body.length) throw new Error("Add some content before publishing")
        const payload = {
            title,
            ...(input.slug.trim() ? { slug: input.slug.trim() } : {}),
            excerpt: input.excerpt.trim() || undefined,
            coverImageUrl: input.coverImageUrl.trim() || undefined,
            categoryId: uuid.test(input.categoryId) ? input.categoryId : undefined,
            type: TYPES.includes(input.type) ? input.type : undefined,
            tags: input.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
            featured: input.featured,
            metaTitle: input.metaTitle.trim() || undefined,
            metaDescription: input.metaDescription.trim() || undefined,
            body,
        }
        const saved = input.id
            ? await consoleWrite(`/admin/articles/${input.id}`, "PATCH", payload)
            : await consoleWrite("/admin/articles", "POST", payload)
        const id = text(saved.id) || input.id!
        if (input.status !== (input.id ? input.previousStatus : "DRAFT")) {
            await consoleWrite(`/admin/articles/${id}/status`, "POST", { status: input.status })
        }
        refresh()
        return { id, success: input.status !== "PUBLISHED" ? "Saved." : input.previousStatus === "PUBLISHED" ? "Saved. The changes are live on the website." : "Published. It is live on the website." }
    } catch (error) {
        return failure(error)
    }
}

export async function setBlogStatus(id: string, status: string): Promise<BlogResult> {
    await requireSuperAdmin()
    try {
        if (!uuid.test(id) || !STATUSES.includes(status)) throw new Error("Invalid request")
        await consoleWrite(`/admin/articles/${id}/status`, "POST", { status })
        refresh()
        return { id, success: "Status updated." }
    } catch (error) {
        return failure(error)
    }
}

export async function deleteBlog(id: string): Promise<BlogResult> {
    await requireSuperAdmin()
    try {
        if (!uuid.test(id)) throw new Error("Invalid blog")
        await consoleWrite(`/admin/articles/${id}`, "DELETE")
        refresh()
        return { success: "Blog deleted." }
    } catch (error) {
        return failure(error)
    }
}

export async function createBlogCategory(name: string): Promise<BlogResult> {
    await requireSuperAdmin()
    try {
        const clean = name.trim()
        if (clean.length < 2 || clean.length > 80) throw new Error("The category name needs 2 to 80 characters")
        const category = await consoleWrite("/admin/article-categories", "POST", { name: clean })
        refresh()
        return { id: text(category.id), success: "Category added." }
    } catch (error) {
        return failure(error)
    }
}

export async function deleteBlogCategory(id: string): Promise<BlogResult> {
    await requireSuperAdmin()
    try {
        if (!uuid.test(id)) throw new Error("Invalid category")
        await consoleWrite(`/admin/article-categories/${id}`, "DELETE")
        refresh()
        return { success: "Category deleted." }
    } catch (error) {
        return failure(error)
    }
}
