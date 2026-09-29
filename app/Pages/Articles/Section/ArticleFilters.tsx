"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArticleCategory, ArticleSearch } from "@/app/lib/articles/types"
import { ARTICLES_PATH, articleSearchHref } from "@/app/lib/articles/format"

type ArticleFiltersProps = {
    search: ArticleSearch
    categories: ArticleCategory[]
}

export default function ArticleFilters({ search, categories }: ArticleFiltersProps) {

    const router = useRouter();
    const [query, setQuery] = useState(search.q ?? "");
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const current = categories.find((category) => category.slug === search.category);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        router.push(articleSearchHref({ category: search.category, q: query.trim() || undefined }));
    }

    function clear() {
        setQuery("");
        router.push(ARTICLES_PATH);
    }

    const option = "block h-6.5 px-2.75 text-sm leading-6.5 whitespace-nowrap no-underline hover:bg-[rgba(111,111,111,0.5)]";

    return (
        <>
            <div className="flex flex-wrap items-center gap-x-6.25 gap-y-2.5 font-sans">
                <form onSubmit={submit} role="search" className="relative">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#957e4d" strokeWidth="1.6" className="pointer-events-none absolute top-3 left-3"><circle cx="6.8" cy="6.8" r="5.3" /><path d="M10.8 10.8L15 15" strokeLinecap="round" /></svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search articles"
                        aria-label="Search articles"
                        className="h-10.5 w-61.5 rounded-full border border-gold bg-transparent pr-5 pl-12.5 text-sm font-medium text-white outline-none placeholder:text-white max-[1179px]:w-48 max-[675px]:text-base"
                    />
                </form>
                <button type="button" onClick={clear} className="h-10.5 w-25 cursor-pointer rounded-full border border-gold bg-transparent font-sans text-sm font-medium text-white transition hover:bg-gold">Clear Search</button>

                <div ref={menuRef} className="relative">
                    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="cursor-pointer rounded-full border-0 bg-[#2d2c2c] p-3.75 font-sans text-sm font-medium text-white">
                        Filter by: <span className="text-gold underline">{current?.name ?? "Default"}</span>
                    </button>
                    {open && (
                        <div className="absolute top-full left-0 z-20 mt-2 rounded border border-[#7c7c7c] bg-white">
                            <span className="block h-9.25 border-b border-[#7c7c7c] px-2.75 text-sm leading-9 font-medium text-[#a39161]">Filter by</span>
                            <ul className="my-2.5 max-h-62.5 w-57.5 list-none overflow-y-auto p-0">
                                {[{ slug: "", name: "Default" }, ...categories].map((category) => {
                                    const active = (search.category ?? "") === category.slug;
                                    return (
                                        <li key={category.slug}>
                                            <Link
                                                href={articleSearchHref({ q: search.q, category: category.slug || undefined })}
                                                onClick={() => setOpen(false)}
                                                className={`${option} ${active ? "bg-black/30 text-white" : "text-[#a39161]"}`}
                                            >
                                                {category.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
