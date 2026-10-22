import Link from "next/link"
import { Article } from "@/app/lib/articles/types"
import { ARTICLES_PATH, articleHref } from "@/app/lib/articles/format"

export default function LatestSidebar({ articles }: { articles: Article[] }) {
    return (
        <>
            <div className="fixed top-[11vh] z-5 hidden h-[calc(46.5vh+248.5px)] w-[min(320px,calc((min(100%,1400px)-40px)*0.28))] scale-90 font-sans min-[837px]:block">
                <div className="mb-6.25 flex items-center justify-between">
                    <h2 className="m-0 text-lg leading-7.5 font-bold text-white">Latest articles</h2>
                    <Link href={ARTICLES_PATH} className="text-lg leading-7.5 font-bold text-gold underline">View all</Link>
                </div>
                <div className="h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-[11px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-gold [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-track]:bg-transparent">
                    {articles.map((item) => (
                        <div key={item.slug} className="my-3.75 w-[calc((100%+11px)*0.93)]">
                            <Link href={articleHref(item)} className="block no-underline">
                                <span className="block aspect-5/3 w-full rounded-[5px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.image})` }}></span>
                                <h2 className="my-[16.6px] text-xl leading-7.5 font-bold text-white">{item.title}</h2>
                            </Link>
                            <Link href={articleHref(item)} className="text-sm leading-[21.8px] font-bold text-gold no-underline">Read more</Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
