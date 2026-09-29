import Link from "next/link"
import { Article } from "@/app/lib/articles/types"
import { ARTICLES_PATH, articleHref, formatArticleDate } from "@/app/lib/articles/format"
import ShareMenu from "./Section/ShareMenu"
import ArticleBody from "./Section/ArticleBody"

// Desktop: photo column on the left with the latest articles, white reading column on the right.
// Below 837px only the article shows.
export default function ArticleDetail({ article, latest }: { article: Article, latest: Article[] }) {
    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden min-[837px]:block">
                <div className="absolute inset-y-0 left-0 w-[38%] bg-[url(/img/article-side-bg.png)] bg-cover bg-position-[center_35%] max-[1342px]:w-1/2"></div>
                <div className="absolute inset-y-0 right-0 left-[calc(max(0px,(100%-1400px)/2)+466px)] bg-white max-[1400px]:left-[35%]"></div>
            </div>

            <main className="relative z-1 bg-white font-sans min-[837px]:bg-transparent">
                <div className="mx-auto flex w-full max-w-350 min-[837px]:px-5">
                    <aside className="hidden w-[calc(35vw-20px)] max-w-111.5 shrink-0 pt-5 pr-10 min-[837px]:block min-[1401px]:w-111.5">
                        <div className="sticky top-5 flex max-h-[calc(100vh-40px)] flex-col">
                            <div className="flex items-center justify-between">
                                <h2 className="m-0 text-lg leading-7.5 font-bold text-white">Latest articles</h2>
                                <Link href={ARTICLES_PATH} className="text-lg leading-7.5 font-bold text-gold underline">View all</Link>
                            </div>
                            <ul className="m-0 mt-2.5 list-none overflow-y-auto overscroll-contain p-0 pr-4 [scrollbar-color:#957e4d_transparent] [scrollbar-width:thin]">
                                {latest.map((item) => (
                                    <li key={item.slug} className="my-3.75">
                                        <Link href={articleHref(item)} className="no-underline">
                                            <img src={item.image} alt="" className="block h-52.5 w-full rounded-[5px] object-cover" />
                                            <h3 className="mt-2.5 mb-0 text-xl leading-7.5 font-bold text-white">{item.title}</h3>
                                        </Link>
                                        <Link href={articleHref(item)} className="text-sm leading-5.5 font-bold text-gold no-underline hover:underline">Read more</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    <article className="min-w-0 flex-1 px-5 pt-5 pb-25 max-[836px]:pt-12.5 max-[581px]:px-3">
                        <div className="max-w-222.5">
                            <Link href={ARTICLES_PATH} className="mb-11.25 block text-base leading-5 font-semibold text-[#7c7c7c] no-underline hover:text-gold">&lt; Return to articles</Link>
                            <h1 className="m-0 text-[50px] leading-none font-semibold text-[#2f2f2f] max-[807px]:text-[45px] max-[581px]:text-[38px]">{article.title}</h1>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-dotted border-[#2f2f2f] pb-2">
                                <p className="m-0 text-base leading-5 font-semibold text-ink">{formatArticleDate(article.publishedAt)}</p>
                                <div className="flex flex-wrap items-center gap-5 max-[1100px]:w-full max-[1100px]:flex-col-reverse">
                                    <a href="https://www.google.com/preferences/source?q=changecars.co.za" target="_blank" rel="noopener" className="flex h-10 items-center rounded-[5px] bg-gold px-3 text-sm font-medium text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.07)] hover:opacity-80">Make CHANGECARS a preferred source on Google</a>
                                    <div className="max-[1100px]:self-end max-[1100px]:-mt-9"><ShareMenu title={article.title} /></div>
                                </div>
                            </div>
                            <ArticleBody blocks={article.body} />
                        </div>
                    </article>
                </div>
            </main>
        </>
    )
}
