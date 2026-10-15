"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { BlogBlock, BlogInput, BlogResult, saveBlog } from "@/app/lib/dashboard/blog-actions"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import PageHeader from "../ui/PageHeader"
import { button, input } from "../ui/format"
import type { BlogCategory } from "./BlogsList"

type Keyed = BlogBlock & { key: number }
export type BlogInitial = Omit<BlogInput, "body" | "status" | "previousStatus"> & { body: BlogBlock[], status: string, updatedAt?: string }

const base = "/dashboard/super-admin/blogs"
const TYPES = [["ARTICLE", "Article"], ["NEWS", "News"], ["REVIEW", "Review"], ["ADVICE", "Advice"], ["GUIDE", "Guide"]]
const BLOCKS: [BlogBlock["type"], string][] = [["paragraph", "Paragraph"], ["heading", "Heading"], ["list", "List"], ["quote", "Quote"], ["image", "Image"], ["link", "Link"], ["video", "Video"]]
const field = `${input} h-11 w-full`
const area = `${input} h-auto w-full py-2.5 leading-6`

let nextKey = 1
const keyed = (block: BlogBlock): Keyed => ({ ...block, key: nextKey++ })
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160)

function empty(type: BlogBlock["type"]): BlogBlock {
    switch (type) {
        case "heading": return { type, text: "", level: 2 }
        case "list": return { type, items: [""] }
        case "image": return { type, src: "", alt: "" }
        case "link": return { type, text: "", href: "" }
        case "video": return { type, url: "" }
        default: return { type, text: "" }
    }
}

function Label({ children, hint }: { children: React.ReactNode, hint?: React.ReactNode }) {
    return <span className="flex items-baseline justify-between gap-2 text-sm font-bold text-ink">{children}{hint && <span className="text-xs font-normal text-[#6b6862]">{hint}</span>}</span>
}

function BlockFields({ block, change }: { block: Keyed, change: (next: Partial<Keyed>) => void }) {
    switch (block.type) {
        case "paragraph":
        case "quote":
            return <textarea aria-label={block.type} rows={block.type === "quote" ? 2 : 4} className={`${area} ${block.type === "quote" ? "italic" : ""}`} placeholder={block.type === "quote" ? "Quote text" : "Write a paragraph…"} value={block.text} onChange={(event) => change({ text: event.target.value })} />
        case "heading":
            return (
                <div className="flex gap-2">
                    <select aria-label="Heading size" className={`${input} h-11 w-24`} value={block.level} onChange={(event) => change({ level: Number(event.target.value) as 2 | 3 | 4 })}>
                        <option value={2}>H2</option><option value={3}>H3</option><option value={4}>H4</option>
                    </select>
                    <input aria-label="Heading" className={`${field} font-bold`} placeholder="Section heading" value={block.text} maxLength={300} onChange={(event) => change({ text: event.target.value })} />
                </div>
            )
        case "list":
            return <textarea aria-label="List items" rows={4} className={area} placeholder={"One item per line\nSecond item"} value={block.items.join("\n")} onChange={(event) => change({ items: event.target.value.split("\n") })} />
        case "image":
            return (
                <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
                        <input aria-label="Image URL" className={field} placeholder="https://… or /img/…" value={block.src} onChange={(event) => change({ src: event.target.value })} />
                        <input aria-label="Image description" className={field} placeholder="Description for screen readers" value={block.alt ?? ""} maxLength={300} onChange={(event) => change({ alt: event.target.value })} />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element -- preview of any host */}
                    {block.src && <img src={block.src} alt={block.alt ?? ""} className="max-h-56 rounded-lg object-cover" />}
                </div>
            )
        case "link":
            return (
                <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
                    <input aria-label="Link text" className={field} placeholder="Link text" value={block.text} maxLength={300} onChange={(event) => change({ text: event.target.value })} />
                    <input aria-label="Link address" className={field} placeholder="https://… or /cars" value={block.href} onChange={(event) => change({ href: event.target.value })} />
                </div>
            )
        case "video":
            return <input aria-label="Video URL" className={field} placeholder="https://www.youtube.com/watch?v=…" value={block.url} onChange={(event) => change({ url: event.target.value })} />
    }
}

export default function BlogEditor({ initial, categories, justCreated = false }: { initial: BlogInitial | null, categories: BlogCategory[], justCreated?: boolean }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [result, setResult] = useState<BlogResult>(justCreated ? { success: initial?.status === "PUBLISHED" ? "Blog created and published." : "Blog created as a draft." } : {})
    const [title, setTitle] = useState(initial?.title ?? "")
    const [slug, setSlug] = useState(initial?.slug ?? "")
    const [slugTouched, setSlugTouched] = useState(!!initial)
    const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
    const [cover, setCover] = useState(initial?.coverImageUrl ?? "")
    const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
    const [type, setType] = useState(initial?.type || "ARTICLE")
    const [tags, setTags] = useState((initial?.tags ?? []).join(", "))
    const [featured, setFeatured] = useState(initial?.featured ?? false)
    const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "")
    const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "")
    const [status, setStatus] = useState(initial?.status ?? "DRAFT")
    const [blocks, setBlocks] = useState<Keyed[]>(() => (initial?.body.length ? initial.body : [empty("paragraph")]).map(keyed))

    const change = (key: number, next: Partial<Keyed>) => setBlocks((list) => list.map((block) => block.key === key ? { ...block, ...next } as Keyed : block))
    const move = (index: number, by: number) => setBlocks((list) => {
        const copy = [...list]; const [item] = copy.splice(index, 1); copy.splice(index + by, 0, item); return copy
    })
    const add = (type: BlogBlock["type"]) => setBlocks((list) => [...list, keyed(empty(type))])

    const save = (nextStatus: string) => startTransition(async () => {
        const body = blocks.map((block) => { const copy: Partial<Keyed> = { ...block }; delete copy.key; return copy as BlogBlock })
        const outcome = await saveBlog({
            id: initial?.id, title, slug: slugTouched ? slug : "", excerpt, coverImageUrl: cover, categoryId, type,
            tags: tags.split(","), featured, metaTitle, metaDescription, body,
            status: nextStatus as BlogInput["status"], previousStatus: initial?.status,
        })
        setResult(outcome)
        if (outcome.error) return
        setStatus(nextStatus)
        if (!initial && outcome.id) router.replace(`${base}/${outcome.id}?saved=1`)
        else router.refresh()
    })

    const published = initial?.status === "PUBLISHED"
    const words = blocks.reduce((total, block) => total + ("text" in block ? block.text : "items" in block ? block.items.join(" ") : "").split(/\s+/).filter(Boolean).length, 0)

    return (
        <div>
            <PageHeader
                title={initial ? "Edit blog" : "New blog"}
                subtitle={initial ? <>Last saved {initial.updatedAt ? new Date(initial.updatedAt).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</> : "Drafts stay private until you publish them."}
                actions={<>
                    <Link href={base} className={button.outline}><Icon name="back" size={16} />All blogs</Link>
                    {published && <a href={`/blogs/${initial?.slug}`} target="_blank" rel="noopener noreferrer" className={button.outline}><Icon name="eye" size={16} />View on website</a>}
                </>}
            />

            {(result.error || result.success) && (
                <div role={result.error ? "alert" : "status"} className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${result.error ? "border-[#f3c9c4] bg-[#fdecea] text-[#b42318]" : "border-[#cfe9d9] bg-[#e7f5ec] text-[#1f7a4a]"}`}>
                    {result.error ?? result.success}
                </div>
            )}

            <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1100px]:grid-cols-1">
                <div className="grid min-w-0 gap-5">
                    <Card>
                        <div className="grid gap-4">
                            <label className="grid gap-1.5">
                                <Label hint={`${title.length}/200`}>Title</Label>
                                <input className={`${input} h-13 w-full text-lg font-bold`} placeholder="e.g. How to sell your car for the best price" value={title} maxLength={200}
                                    onChange={(event) => { setTitle(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)) }} />
                            </label>
                            <label className="grid gap-1.5">
                                <Label hint="Leave as is to follow the title">Web address</Label>
                                <span className="flex items-center overflow-hidden rounded-lg border border-[#d9d4c8] bg-[#f7f5f0] focus-within:border-gold">
                                    <span className="px-3 text-sm whitespace-nowrap text-[#6b6862]">/blogs/</span>
                                    <input className="h-11 min-w-0 flex-1 border-0 bg-white px-3 text-sm outline-none" value={slug} maxLength={160} placeholder="how-to-sell-your-car"
                                        onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)) }} />
                                </span>
                            </label>
                            <label className="grid gap-1.5">
                                <Label hint={`${excerpt.length}/500`}>Summary</Label>
                                <textarea rows={3} className={area} maxLength={500} placeholder="One or two sentences shown on the blog list and in search results." value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
                            </label>
                        </div>
                    </Card>

                    <Card title="Content" action={<span className="text-xs text-[#6b6862]">{words} words · {blocks.length} blocks</span>}>
                        <div className="grid gap-3">
                            {blocks.map((block, index) => (
                                <div key={block.key} className="rounded-xl border border-[#ebe8e1] bg-[#fcfbf9] p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold tracking-wide text-[#6b6862] uppercase">{BLOCKS.find(([value]) => value === block.type)?.[1]}</span>
                                        <span className="flex gap-1">
                                            <button type="button" aria-label="Move up" disabled={index === 0} className={button.small} onClick={() => move(index, -1)}><Icon name="up" size={13} /></button>
                                            <button type="button" aria-label="Move down" disabled={index === blocks.length - 1} className={button.small} onClick={() => move(index, 1)}><Icon name="down" size={13} /></button>
                                            <button type="button" aria-label="Remove block" className={`${button.small} hover:border-[#b42318]! hover:text-[#b42318]!`} onClick={() => setBlocks((list) => list.filter((item) => item.key !== block.key))}><Icon name="trash" size={13} /></button>
                                        </span>
                                    </div>
                                    <BlockFields block={block} change={(next) => change(block.key, next)} />
                                </div>
                            ))}
                            {!blocks.length && <p className="m-0 rounded-xl border border-dashed border-[#d9d4c8] p-6 text-center text-sm text-[#6b6862]">No content yet. Add a block below.</p>}
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#d9d4c8] p-3">
                                <span className="mr-1 text-sm font-bold text-[#6b6862]">Add</span>
                                {BLOCKS.map(([value, name]) => <button key={value} type="button" className={button.small} onClick={() => add(value)}><Icon name="plus" size={12} />{name}</button>)}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="sticky top-5 grid gap-5 max-[1100px]:static">
                    <Card title="Publish">
                        <div className="grid gap-3">
                            <label className="grid gap-1.5">
                                <Label>Status</Label>
                                <select className={field} value={status} onChange={(event) => setStatus(event.target.value)}>
                                    <option value="DRAFT">Draft (not visible)</option>
                                    <option value="PUBLISHED">Published (live)</option>
                                    <option value="ARCHIVED">Archived (hidden)</option>
                                </select>
                            </label>
                            <button type="button" disabled={pending} className={`${button.gold} h-11 w-full justify-center`} onClick={() => save(status)}>
                                {pending ? "Saving…" : !initial ? (status === "PUBLISHED" ? "Publish blog" : "Save blog") : "Save changes"}
                            </button>
                            {status !== "PUBLISHED" && <button type="button" disabled={pending} className={`${button.outline} h-11 w-full justify-center`} onClick={() => save("PUBLISHED")}>Save and publish</button>}
                        </div>
                    </Card>

                    <Card title="Cover image">
                        <div className="grid gap-2">
                            {cover
                                // eslint-disable-next-line @next/next/no-img-element -- preview of any host
                                ? <img src={cover} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
                                : <span className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-[#f4f2ee] text-sm text-[#6b6862]">No cover image</span>}
                            <input aria-label="Cover image URL" className={field} placeholder="https://… or /img/…" value={cover} onChange={(event) => setCover(event.target.value)} />
                        </div>
                    </Card>

                    <Card title="Details">
                        <div className="grid gap-3">
                            <label className="grid gap-1.5"><Label>Category</Label>
                                <select className={field} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                                    <option value="">Uncategorised</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1.5"><Label>Type</Label>
                                <select className={field} value={type} onChange={(event) => setType(event.target.value)}>
                                    {TYPES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1.5"><Label hint="Comma separated">Tags</Label>
                                <input className={field} placeholder="selling, valuation" value={tags} onChange={(event) => setTags(event.target.value)} />
                            </label>
                            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#d9d4c8] p-3 text-sm has-checked:border-gold has-checked:bg-gold/5">
                                <input type="checkbox" className="accent-gold" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
                                <span><span className="block font-bold">Featured</span><span className="block text-xs text-[#6b6862]">Shown at the top of the news page</span></span>
                            </label>
                        </div>
                    </Card>

                    <Card title="Search engines">
                        <div className="grid gap-3">
                            <label className="grid gap-1.5"><Label hint={`${metaTitle.length}/70`}>Meta title</Label>
                                <input className={field} maxLength={70} placeholder={title || "Defaults to the title"} value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} />
                            </label>
                            <label className="grid gap-1.5"><Label hint={`${metaDescription.length}/170`}>Meta description</Label>
                                <textarea rows={3} className={area} maxLength={170} placeholder={excerpt || "Defaults to the summary"} value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} />
                            </label>
                            <div className="rounded-lg bg-[#f7f5f0] p-3">
                                <p className="m-0 truncate text-sm font-bold text-[#1f5fae]">{metaTitle || title || "Blog title"}</p>
                                <p className="m-0 truncate text-xs text-[#1f7a4a]">changecars.co.za/blogs/{slug || "web-address"}</p>
                                <p className="m-0 mt-1 line-clamp-2 text-xs text-[#5c5850]">{metaDescription || excerpt || "The summary appears here in search results."}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
