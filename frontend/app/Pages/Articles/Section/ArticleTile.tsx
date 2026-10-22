import Link from "next/link"
import { Article } from "@/app/lib/articles/types"
import { articleHref, formatArticleDate } from "@/app/lib/articles/format"

export default function ArticleTile({ article }: { article: Article }) {

    const href = articleHref(article);

    return (
        <>
            <article className="relative h-93 overflow-hidden rounded-[5px] bg-white font-sans shadow-[5px_5px_15px_rgba(0,0,0,0.15)]">
                <Link href={href} aria-label={article.title} className="block h-1/2 overflow-hidden">
                    <img src={article.image} alt="" className="size-full object-cover transition duration-500 hover:scale-105" />
                </Link>
                <div className="relative h-1/2 p-7.5">
                    <h2 className="m-0 line-clamp-3 text-xl leading-6 font-bold text-ink">
                        <Link href={href} className="text-ink no-underline hover:text-gold">{article.title}</Link>
                    </h2>
                    <p className="my-2.5 text-sm leading-[19.2px] text-ink max-[675px]:text-base">{formatArticleDate(article.publishedAt)}</p>
                    <Link href={href} className="absolute bottom-7.5 font-[Arial] text-[13px] leading-5.5 font-bold text-gold no-underline hover:underline max-[675px]:text-[15px]">Read more</Link>
                </div>
            </article>
        </>
    )
}
