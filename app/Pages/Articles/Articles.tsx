import Link from "next/link"
import { Article, ArticleCategory, ArticleSearch, ArticleSearchResult } from "@/app/lib/articles/types"
import { articleSearchHref } from "@/app/lib/articles/format"
import ArticleTile from "./Section/ArticleTile"
import FeaturedArticle from "./Section/FeaturedArticle"
import ArticleFilters from "./Section/ArticleFilters"

type ArticlesProps = {
    search: ArticleSearch
    result: ArticleSearchResult
    featured?: Article
    categories: ArticleCategory[]
}

// Dark car photo across the top (running up behind the header on desktop), cards on white below.
export default function Articles({ search, result, featured, categories }: ArticlesProps) {

    const filtering = !!(search.q || search.category);
    const showFeatured = featured && !filtering && result.page === 1;
    const pageLink = "flex h-9.75 min-w-9.75 items-center justify-center rounded-[5px] px-3 font-sans text-sm font-bold no-underline";

    return (
        <>
            <main className="relative isolate bg-white">
                <div aria-hidden="true" className="absolute inset-x-0 -top-27 -z-1 hidden h-159.25 bg-[url(/img/articles-bg.jpg)] bg-cover bg-center min-[981px]:block min-[1112px]:max-[1281px]:-top-34.5 min-[981px]:max-[1111px]:top-0"></div>

                <div className="mx-auto w-full max-w-350 px-3.75 pt-15 pb-20 max-[980px]:px-0 max-[980px]:pt-0">
                    <div className="max-[980px]:bg-[url(/img/articles-bg.jpg)] max-[980px]:bg-cover max-[980px]:bg-center max-[980px]:px-3.75 max-[980px]:pt-10 max-[980px]:pb-5">
                        <h1 className="m-0 font-sans text-[58px] leading-[62.5px] font-light text-white uppercase max-[980px]:text-[56px] max-[980px]:leading-[60px]">Motoring <strong className="font-light text-gold">News</strong></h1>
                        <p className="m-0 max-w-183.25 pt-5 pb-7.5 font-sans text-xl leading-5 font-bold tracking-[0.02em] text-white max-[980px]:text-base">Catch up on all the latest happenings in the motoring world!</p>
                        <ArticleFilters key={`${search.q}-${search.category}`} search={search} categories={categories} />
                    </div>

                    <div className="mt-5 grid grid-flow-dense grid-cols-4 gap-7.5 max-[1000px]:grid-cols-3 max-[980px]:mt-0 max-[980px]:px-3.75 max-[980px]:pt-6.25 max-[745px]:grid-cols-2 max-[540px]:grid-cols-1">
                        {showFeatured && (
                            <div className="col-span-3 col-start-2 row-start-1 max-[1218px]:col-span-full max-[1218px]:col-start-1">
                                <FeaturedArticle article={featured} />
                            </div>
                        )}
                        {result.articles.map((article) => <ArticleTile key={article.slug} article={article} />)}
                    </div>

                    {result.articles.length === 0 && (
                        <p className="mt-10 text-center font-sans text-[22px] font-bold text-ink">No articles match your search.</p>
                    )}

                    {result.pageCount > 1 && (
                        <nav aria-label="Pages" className="mt-10 flex justify-center gap-2">
                            {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((page) => (
                                <Link key={page} href={articleSearchHref({ ...search, page })} aria-current={page === result.page ? "page" : undefined} className={`${pageLink} ${page === result.page ? "bg-gold text-white" : "border border-gold text-gold"}`}>{page}</Link>
                            ))}
                        </nav>
                    )}
                </div>
            </main>
        </>
    )
}
