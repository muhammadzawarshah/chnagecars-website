import { Article } from "../Data/blocks"

export default function ArticleCard({ article }: { article: Article }) {
    return (
        <>
            <a href={article.href} className="group flex h-full flex-col overflow-hidden rounded-[14px] bg-white no-underline shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
                <div className="aspect-[2.27] w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${article.image})` }}></div>
                <div className="flex flex-1 flex-col px-4.5 pt-4 pb-4.5 max-[601px]:px-3.5 max-[601px]:pt-3.5 max-[601px]:pb-3.5">
                    <p className="m-0 text-[13px] leading-4 font-bold text-[#957e4e] max-[601px]:text-[12.5px]">{article.date}</p>
                    <h3 className="mt-2 mb-0 line-clamp-2 text-lg leading-6 font-bold text-black wrap-anywhere max-[601px]:text-[15px] max-[601px]:leading-5">{article.title}</h3>
                    {article.excerpt && (
                        <p className="mt-2 mb-0 line-clamp-3 text-sm leading-5 text-[#555] max-[601px]:text-[12.5px] max-[601px]:leading-4.5">{article.excerpt}</p>
                    )}
                    <div className="mt-auto flex items-center pt-6.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#957e4e] text-[11px] font-bold text-white max-[601px]:size-7">CC</span>
                        <span className="ml-2 text-[13px] font-bold text-[#333] max-[601px]:text-xs">ChangeCars</span>
                        <span className="ml-auto flex items-center gap-1 text-[13px] font-bold text-[#957e4e] underline group-hover:opacity-80 max-[601px]:text-xs">
                            Read More
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 5h8M5.5 1.5L9 5 5.5 8.5" /></svg>
                        </span>
                    </div>
                </div>
            </a>
        </>
    )
}
