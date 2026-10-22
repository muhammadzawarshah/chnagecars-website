"use client"

import { websiteUrl } from "@/app/lib/site"

import Form from "next/form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { BlogResult, createBlogCategory, deleteBlog, deleteBlogCategory, setBlogStatus } from "@/app/lib/dashboard/blog-actions"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import PageHeader from "../ui/PageHeader"
import StatCard from "../ui/StatCard"
import StatusBadge from "../ui/StatusBadge"
import { button, input, table } from "../ui/format"
import FilterButton from "./FilterButton"

export type BlogRow = {
    id: string, title: string, slug: string, status: string, type: string, featured: boolean,
    coverImageUrl: string, category: string, publishedAt: string, updatedAt: string,
}
export type BlogCategory = { id: string, name: string, slug: string }
type Counts = { total: number, published: number, drafts: number, archived: number }
type Filters = { status: string, q: string, category: string }

const base = "/dashboard/super-admin/blogs"
const TABS = [["", "All"], ["PUBLISHED", "Published"], ["DRAFT", "Drafts"], ["ARCHIVED", "Archived"]] as const

const when = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }) : "—"
const label = (value: string) => value ? value.charAt(0) + value.slice(1).toLowerCase() : "—"

function href(filters: Filters, changes: Partial<Filters & { page: number }>) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries({ ...filters, ...changes })) if (value) params.set(key, String(value))
    const query = params.toString()
    return query ? `${base}?${query}` : base
}

export default function BlogsList({ rows, meta, counts, categories, filters }: { rows: BlogRow[], meta: { page: number, pageCount: number, total: number }, counts: Counts, categories: BlogCategory[], filters: Filters }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [notice, setNotice] = useState<BlogResult>({})
    const [confirm, setConfirm] = useState<BlogRow | null>(null)
    const [showCategories, setShowCategories] = useState(false)
    const [categoryName, setCategoryName] = useState("")
    const [categoryError, setCategoryError] = useState("")

    const run = (action: () => Promise<BlogResult>, after?: () => void) => startTransition(async () => {
        const result = await action()
        setNotice(result)
        if (!result.error) after?.()
    })

    return (
        <div>
            <PageHeader
                title="Blogs"
                subtitle="Write, publish and manage the articles shown on the website's blog."
                actions={<>
                    <button type="button" className={button.outline} onClick={() => { setCategoryError(""); setShowCategories(true) }}>Categories</button>
                    <Link href={`${base}/new`} className={button.gold}><Icon name="plus" size={16} />New blog</Link>
                </>}
            />

            {(notice.success || notice.error) && (
                <div role={notice.error ? "alert" : "status"} className={`mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${notice.error ? "border-[#f3c9c4] bg-[#fdecea] text-[#b42318]" : "border-[#cfe9d9] bg-[#e7f5ec] text-[#1f7a4a]"}`}>
                    <span className="flex items-center gap-2"><Icon name={notice.error ? "close" : "check"} size={16} />{notice.error ?? notice.success}</span>
                    <button type="button" aria-label="Dismiss" className="cursor-pointer border-0 bg-transparent text-current" onClick={() => setNotice({})}><Icon name="close" size={16} /></button>
                </div>
            )}

            <div className="mb-5 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[600px]:gap-3">
                <StatCard label="All blogs" value={String(counts.total)} icon="blog" hint={`${categories.length} categories`} />
                <StatCard label="Published" value={String(counts.published)} icon="check" hint="Live on the website" />
                <StatCard label="Drafts" value={String(counts.drafts)} icon="edit" hint="Not visible yet" />
                <StatCard label="Archived" value={String(counts.archived)} icon="close" hint="Hidden from the website" />
            </div>

            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {TABS.map(([value, name]) => (
                            <Link key={value} href={href(filters, { status: value, page: 0 })} aria-current={filters.status === value ? "page" : undefined}
                                className={`inline-flex h-8.5 items-center rounded-full border px-3.5 text-xs font-bold no-underline transition ${filters.status === value ? "border-gold bg-gold text-white" : "border-[#d9d4c8] bg-white text-ink hover:border-gold hover:text-gold"}`}>
                                {name}
                            </Link>
                        ))}
                    </div>
                    <Form className="flex flex-wrap items-center gap-2" action={base} scroll={false}>
                        {filters.status && <input type="hidden" name="status" value={filters.status} />}
                        <select aria-label="Category" name="category" defaultValue={filters.category} className={input} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
                            <option value="">All categories</option>
                            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                        </select>
                        <label className="relative flex items-center">
                            <span className="pointer-events-none absolute left-3 text-[#6b6862]"><Icon name="search" size={16} /></span>
                            <input aria-label="Search blogs" name="q" defaultValue={filters.q} maxLength={100} placeholder="Search by title" className={`${input} w-64 pl-9 max-[600px]:w-full`} />
                        </label>
                        <FilterButton />
                        {(filters.q || filters.category) && <Link href={href(filters, { q: "", category: "", page: 0 })} scroll={false} className="text-sm font-bold text-gold">Clear filters</Link>}
                    </Form>
                </div>

                <div className={table.wrap}>
                    <table className={table.table}>
                        <thead><tr>
                            <th className={table.head}>Blog</th>
                            <th className={table.head}>Category</th>
                            <th className={table.head}>Status</th>
                            <th className={table.head}>Date</th>
                            <th className={`${table.head} w-1 text-right`}>Actions</th>
                        </tr></thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className={table.row}>
                                    <td className={table.cell}>
                                        <div className="flex items-center gap-3">
                                            {row.coverImageUrl
                                                // eslint-disable-next-line @next/next/no-img-element -- cover images can live on any host
                                                ? <img src={row.coverImageUrl} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                                                : <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-[#f4f2ee] text-[#b5afa3]"><Icon name="blog" size={22} /></span>}
                                            <span className="min-w-0">
                                                <Link href={`${base}/${row.id}`} className="block font-bold text-ink no-underline hover:text-gold">
                                                    {row.featured && <span title="Featured" className="mr-1 inline-flex align-[-2px] text-gold"><Icon name="star" size={14} /></span>}
                                                    {row.title}
                                                </Link>
                                                <span className="block truncate text-xs text-[#6b6862]">/blogs/{row.slug} · {label(row.type)}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`${table.cell} max-w-40`}>{row.category || <span className="text-[#6b6862]">Uncategorised</span>}</td>
                                    <td className={table.cell}><StatusBadge status={row.status === "PUBLISHED" ? "published" : row.status === "DRAFT" ? "draft" : "archived"} /></td>
                                    <td className={`${table.cell} whitespace-nowrap`}>
                                        <span className="block">{row.status === "PUBLISHED" ? when(row.publishedAt) : when(row.updatedAt)}</span>
                                        <span className="block text-xs text-[#6b6862]">{row.status === "PUBLISHED" ? "Published" : "Last edited"}</span>
                                    </td>
                                    <td className={`${table.cell} w-1 text-right`}>
                                        <div className="flex justify-end gap-1.5">
                                            <Link href={`${base}/${row.id}`} className={button.small}><Icon name="edit" size={13} />Edit</Link>
                                            {row.status === "PUBLISHED"
                                                ? <>
                                                    {websiteUrl("/") && <a href={websiteUrl(`/blogs/${row.slug}`)} target="_blank" rel="noopener noreferrer" title="View on website" aria-label={`View ${row.title} on the website`} className={button.small}><Icon name="eye" size={13} /></a>}
                                                    <button type="button" disabled={pending} className={button.small} onClick={() => run(() => setBlogStatus(row.id, "DRAFT"))}>Unpublish</button>
                                                </>
                                                : <button type="button" disabled={pending} className={button.small} onClick={() => run(() => setBlogStatus(row.id, "PUBLISHED"))}>Publish</button>}
                                            <button type="button" title="Delete" aria-label={`Delete ${row.title}`} className={`${button.small} hover:border-[#b42318]! hover:text-[#b42318]!`} onClick={() => setConfirm(row)}><Icon name="trash" size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!rows.length && (
                        <div className="px-5 py-12 text-center">
                            <p className="m-0 text-sm text-[#6b6862]">{filters.q || filters.status || filters.category ? "No blogs match these filters." : "No blogs yet."}</p>
                            <Link href={`${base}/new`} className={`${button.gold} mt-4`}><Icon name="plus" size={16} />Write the first blog</Link>
                        </div>
                    )}
                </div>

                {meta.pageCount > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#6b6862]">{meta.total} blogs · Page {meta.page} of {meta.pageCount}</span>
                        <div className="flex gap-2">
                            {meta.page > 1 && <Link className={button.outline} href={href(filters, { page: meta.page - 1 })}>Previous</Link>}
                            {meta.page < meta.pageCount && <Link className={button.outline} href={href(filters, { page: meta.page + 1 })}>Next</Link>}
                        </div>
                    </div>
                )}
            </Card>

            <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this blog?" subtitle={confirm?.title}>
                <p className="mt-0 mb-5 text-sm text-[#5c5850]">It is removed from the website straight away. This cannot be undone. To hide it but keep it, unpublish or archive it instead.</p>
                <div className="flex justify-end gap-3">
                    <button type="button" className={button.outline} onClick={() => setConfirm(null)}>Cancel</button>
                    <button type="button" disabled={pending} className={button.danger} onClick={() => confirm && run(() => deleteBlog(confirm.id), () => { setConfirm(null); router.refresh() })}>{pending ? "Deleting…" : "Delete blog"}</button>
                </div>
            </Modal>

            <Modal open={showCategories} onClose={() => setShowCategories(false)} title="Blog categories" subtitle="Readers filter the blog by these. Deleting one leaves its blogs uncategorised.">
                <form className="mb-4 flex gap-2" onSubmit={(event) => {
                    event.preventDefault()
                    startTransition(async () => {
                        const result = await createBlogCategory(categoryName)
                        setCategoryError(result.error ?? "")
                        if (!result.error) { setCategoryName(""); router.refresh() }
                    })
                }}>
                    <input aria-label="New category name" className={`${input} h-11 flex-1`} placeholder="New category, e.g. Electric cars" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={80} required minLength={2} />
                    <button disabled={pending} className={`${button.gold} h-11`}><Icon name="plus" size={16} />Add</button>
                </form>
                {categoryError && <p role="alert" className="mt-0 mb-4 rounded-lg bg-[#fdecea] px-3 py-2 text-sm text-[#b42318]">{categoryError}</p>}
                <ul className="m-0 grid max-h-80 gap-2 overflow-y-auto p-0">
                    {categories.map((category) => (
                        <li key={category.id} className="flex list-none items-center justify-between gap-3 rounded-lg border border-[#ebe8e1] px-3 py-2.5">
                            <span className="min-w-0"><span className="block text-sm font-bold">{category.name}</span><span className="block text-xs text-[#6b6862]">{category.slug}</span></span>
                            <button type="button" disabled={pending} aria-label={`Delete ${category.name}`} className={`${button.small} hover:border-[#b42318]! hover:text-[#b42318]!`}
                                onClick={() => startTransition(async () => { const result = await deleteBlogCategory(category.id); setCategoryError(result.error ?? ""); if (!result.error) router.refresh() })}>
                                <Icon name="trash" size={13} />
                            </button>
                        </li>
                    ))}
                    {!categories.length && <li className="list-none text-sm text-[#6b6862]">No categories yet.</li>}
                </ul>
            </Modal>
        </div>
    )
}
