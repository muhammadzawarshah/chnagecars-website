import Link from "next/link"
import { Article } from "@/app/lib/articles/types"
import { ARTICLES_PATH, formatArticleDate } from "@/app/lib/articles/format"
import ShareMenu from "./Section/ShareMenu"
import ArticleBody from "./Section/ArticleBody"
import LatestSidebar from "./Section/LatestSidebar"

export default function ArticleDetail({ article, latest }: { article: Article, latest: Article[] }) {
    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden min-[837px]:block">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[url(/img/article/dealer-listings-image.png)] bg-cover bg-position-[50%_35%] bg-no-repeat min-[1343px]:w-[38%]"></div>
                <div className="absolute inset-y-0 right-0 left-[35%] bg-white min-[1401px]:left-[calc((100%-1400px)/2+466px)]"></div>
            </div>

            <main className="relative z-1 bg-white font-sans min-[837px]:bg-transparent max-[981px]:-mt-14">
                <div className="mx-auto flow-root w-full max-w-350 px-5 pt-5 max-[582px]:px-3 max-[582px]:pt-3">
                    <LatestSidebar articles={latest} />

                    <article className="float-right mt-12.75 w-[65%] px-5 pt-5 pb-25 min-[1301px]:mt-0 max-[837px]:float-none max-[837px]:mt-12.5 max-[837px]:w-full max-[582px]:px-3 max-[582px]:pt-3">
                        <Link href={ARTICLES_PATH} className="mb-11.25 block text-base leading-5 font-semibold text-[#7c7c7c] no-underline">&lt; Return to articles</Link>
                        <h1 className="m-0 text-[50px] leading-none font-semibold text-[#2f2f2f] max-[808px]:text-[45px] max-[582px]:text-[38px]">{article.title}</h1>
                        <div className="flow-root border-b border-dotted border-[#2f2f2f]">
                            <p className="float-left my-4 text-base leading-5 font-semibold text-ink">{formatArticleDate(article.publishedAt)}</p>
                            <ShareMenu title={article.title} />
                            <div className="float-right mt-1.75 max-[1101px]:float-none max-[1101px]:clear-both max-[1101px]:mx-auto max-[1101px]:my-1.75 max-[1101px]:w-fit max-[1101px]:max-w-full">
                                <a href="https://www.google.com/preferences/source?q=changecars.co.za" target="_blank" rel="noopener" className="mr-5 block h-10 rounded-[5px] bg-gold px-2.5 text-sm leading-10 font-medium whitespace-nowrap text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.07)] hover:opacity-80 max-[1101px]:mr-0 max-[400px]:truncate">Make CHANGECARS a preferred source on Google</a>
                            </div>
                        </div>
                        <ArticleBody blocks={article.body} />
                    </article>
                </div>
            </main>
        </>
    )
}
