import Link from "next/link"
import { Article } from "@/app/lib/articles/types"
import { articleHref, formatArticleDate } from "@/app/lib/articles/format"

// The big darkened tile: 3 columns wide on desktop, full width below 1218px.
export default function FeaturedArticle({ article }: { article: Article }) {
    return (
        <>
            <Link href={articleHref(article)} className="relative block h-93 overflow-hidden rounded-[5px] font-sans no-underline shadow-[5px_5px_15px_rgba(0,0,0,0.15)]">
                <img src={article.image} alt="" className="absolute inset-0 size-full object-cover brightness-[48%]" />
                <div className="relative px-25 pt-25 text-white max-[1218px]:px-15 max-[1218px]:pt-15 max-[620px]:px-7.5 max-[620px]:pt-7.5">
                    <h2 className="m-0 line-clamp-2 text-[40px] leading-[46px] font-bold max-[620px]:text-[32px] max-[620px]:leading-9.5">{article.title}</h2>
                    <p className="mt-3.75 mb-0 text-base">{formatArticleDate(article.publishedAt)}</p>
                </div>
            </Link>
        </>
    )
}
