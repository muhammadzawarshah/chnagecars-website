"use client"

import { websiteUrl } from "@/app/lib/site"
import Link from "next/link"
import { useState } from "react"
import type { BlogBlock } from "@/app/lib/dashboard/blog-actions"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import PageHeader from "../ui/PageHeader"
import StatusBadge from "../ui/StatusBadge"
import { button } from "../ui/format"
import BlogEditor, { BlogInitial } from "./BlogEditor"
import type { BlogCategory } from "./BlogsList"

const base = "/dashboard/super-admin/blogs"
const TYPE_LABELS: Record<string, string> = { ARTICLE: "Article", NEWS: "News", REVIEW: "Review", ADVICE: "Advice", GUIDE: "Guide" }
const when = (value?: string) => value ? new Date(value).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

// The blog as readers see it; editing happens in the "Edit blog" pop-up.
function Block({ block }: { block: BlogBlock }) {
    switch (block.type) {
        case "heading": {
            const size = block.level === 2 ? "text-xl" : block.level === 3 ? "text-lg" : "text-base"
            return <h3 className={`m-0 mt-2 font-bold text-ink ${size}`}>{block.text}</h3>
        }
        case "list": return <ul className="m-0 grid gap-1 pl-5 text-[15px] leading-7 text-[#3b3935]">{block.items.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ul>
        case "quote": return <blockquote className="m-0 border-l-4 border-gold bg-[#faf6ec] px-4 py-3 text-[15px] leading-7 text-[#3b3935] italic">{block.text}</blockquote>
        // eslint-disable-next-line @next/next/no-img-element -- blog images from any host
        case "image": return block.src ? <figure className="m-0"><img src={block.src} alt={block.alt ?? ""} className="max-h-[420px] w-full rounded-lg object-cover" />{block.alt && <figcaption className="mt-1.5 text-xs text-[#6b6862]">{block.alt}</figcaption>}</figure> : null
        case "link": return <a href={block.href} target="_blank" rel="noopener noreferrer" className="w-fit text-[15px] font-bold text-gold underline">{block.text || block.href}</a>
        case "video": return <a href={block.url} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-2 text-[15px] font-bold text-gold underline"><Icon name="eye" size={16} />Watch video</a>
        default: return <p className="m-0 text-[15px] leading-7 whitespace-pre-line text-[#3b3935]">{block.text}</p>
    }
}

function Detail({ name, children }: { name: string, children: React.ReactNode }) {
    return <div className="min-w-0"><dt className="text-xs font-bold tracking-wide text-[#6b6862] uppercase">{name}</dt><dd className="m-0 mt-1 text-sm font-semibold break-words text-ink">{children}</dd></div>
}

export default function BlogDetail({ blog, categories, justCreated = false }: { blog: BlogInitial & { id: string }, categories: BlogCategory[], justCreated?: boolean }) {
    const [editing, setEditing] = useState(false)
    // Re-mounts the editor on every open, so Cancel always discards unsaved changes.
    const [session, setSession] = useState(0)
    const [notice, setNotice] = useState(justCreated ? (blog.status === "PUBLISHED" ? "Blog created and published." : "Blog created as a draft.") : "")
    const category = categories.find((item) => item.id === blog.categoryId)?.name
    const content = blog.body.filter((block) => block.type === "image" ? block.src : block.type === "list" ? block.items.some(Boolean) : block.type === "video" ? block.url : block.text)
    const published = blog.status === "PUBLISHED"
    const open = () => { setNotice(""); setSession((value) => value + 1); setEditing(true) }

    return (
        <div>
            <PageHeader
                title="Blog"
                subtitle={<>Last saved {when(blog.updatedAt)}</>}
                actions={<>
                    <Link href={base} className={button.outline}><Icon name="back" size={16} />All blogs</Link>
                    {published && websiteUrl("/") && <a href={websiteUrl(`/blogs/${blog.slug}`)} target="_blank" rel="noopener noreferrer" className={button.outline}><Icon name="eye" size={16} />View on website</a>}
                    <button type="button" className={button.gold} onClick={open}><Icon name="edit" size={16} />Edit blog</button>
                </>}
            />

            {notice && <div role="status" className="mb-5 rounded-xl border border-[#cfe9d9] bg-[#e7f5ec] px-4 py-3 text-sm font-bold text-[#1f7a4a]">{notice}</div>}

            <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1100px]:grid-cols-1">
                <Card className="overflow-hidden p-0!">
                    {blog.coverImageUrl
                        // eslint-disable-next-line @next/next/no-img-element -- cover from any host
                        ? <img src={blog.coverImageUrl} alt="" className="aspect-[21/9] w-full object-cover" />
                        : <div className="flex aspect-[21/9] w-full items-center justify-center bg-[#f4f2ee] text-sm text-[#6b6862]">No cover image</div>}
                    <article className="grid gap-4 p-7 max-[600px]:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={blog.status.toLowerCase()} />
                            {category && <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">{category}</span>}
                            {blog.featured && <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">Featured</span>}
                        </div>
                        <h1 className="m-0 text-3xl leading-tight font-bold text-ink max-[600px]:text-2xl">{blog.title}</h1>
                        {blog.excerpt && <p className="m-0 text-base leading-7 text-[#6b6862]">{blog.excerpt}</p>}
                        <hr className="m-0 border-0 border-t border-[#ebe8e1]" />
                        {content.length
                            ? <div className="grid gap-4">{content.map((block, index) => <Block key={index} block={block} />)}</div>
                            : <div className="rounded-xl border border-dashed border-[#d9d4c8] p-8 text-center">
                                <p className="m-0 font-bold text-ink">This blog has no content yet</p>
                                <p className="m-0 mt-1 text-sm text-[#6b6862]">Add the article text before publishing it.</p>
                                <button type="button" className={`${button.gold} mt-4`} onClick={open}><Icon name="edit" size={16} />Write content</button>
                            </div>}
                    </article>
                </Card>

                <div className="grid gap-5">
                    <Card title="Details">
                        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-4">
                            <Detail name="Status"><StatusBadge status={blog.status.toLowerCase()} /></Detail>
                            <Detail name="Type">{TYPE_LABELS[blog.type ?? ""] ?? blog.type ?? "—"}</Detail>
                            <Detail name="Category">{category ?? "Uncategorised"}</Detail>
                            <Detail name="Featured">{blog.featured ? "Yes" : "No"}</Detail>
                            <div className="col-span-2"><Detail name="Web address">/blogs/{blog.slug}</Detail></div>
                            <div className="col-span-2"><Detail name="Tags">{blog.tags.length ? blog.tags.join(", ") : "—"}</Detail></div>
                        </dl>
                    </Card>
                    <Card title="Search engines">
                        <div className="rounded-lg bg-[#f7f5f0] p-3">
                            <p className="m-0 truncate text-sm font-bold text-[#1f5fae]">{blog.metaTitle || blog.title}</p>
                            <p className="m-0 truncate text-xs text-[#1f7a4a]">changecars.co.za/blogs/{blog.slug}</p>
                            <p className="m-0 mt-1 line-clamp-3 text-xs text-[#5c5850]">{blog.metaDescription || blog.excerpt || "No summary yet: search engines will pick text from the page."}</p>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal open={editing} onClose={() => setEditing(false)} title="Edit blog" subtitle={blog.title} width={1180}>
                <BlogEditor key={session} initial={blog} categories={categories}
                    dialog={{ onCancel: () => setEditing(false), onSaved: () => { setEditing(false); setNotice("Changes saved.") } }} />
            </Modal>
        </div>
    )
}
