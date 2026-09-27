import SectionTitle from "../../../components/SectionTitle"
import { articles } from "../Data/blocks"

export default function LatestArticles() {
    return (
        <>
            <section className="m-0 -mt-px bg-white px-8.75">
                <div className="mx-auto max-w-350 pt-25 pb-12.5 max-[901px]:pt-13.75">
                    <SectionTitle>Our Latest <span>Articles</span></SectionTitle>
                    <p className="mt-4 mb-20 text-center text-base leading-6.5 font-normal max-[901px]:mb-12.5 max-[768px]:text-lg">Latest Car News, Reviews and Advice</p>
                    <ul className="m-0 flow-root list-none p-2.5">
                        {articles.map((article) => (
                            <li key={article.title} className="float-left mr-7.5 w-[calc(25%-22.5px)] rounded-[5px] text-left shadow-[5px_5px_15px_rgba(0,0,0,0.15)] nth-4:mr-0 max-[1241px]:mb-7.5 max-[1241px]:w-[calc(50%-15px)] max-[1241px]:nth-[2n]:mr-0 max-[681px]:float-none max-[681px]:mx-auto max-[681px]:mb-7.5 max-[681px]:w-full max-[681px]:max-w-116.25 max-[681px]:nth-[2n]:mx-auto max-[681px]:last:mb-2.5">
                                <a href={article.href} className="group block no-underline">
                                    <div className="h-46.75 w-full rounded-t-[5px] bg-cover bg-center bg-no-repeat max-[1241px]:h-62.5 max-[1001px]:h-46.75" style={{ backgroundImage: `url(${article.image})` }}></div>
                                    <div className="px-7.5 pt-7.5 pb-8.75">
                                        <h3 className="mt-0 mb-2.75 line-clamp-2 h-12 overflow-hidden text-xl leading-6 font-bold text-ink">{article.title}</h3>
                                        <p className="mt-0 mb-7.5 text-sm leading-4.75 text-ink">{article.date}</p>
                                        <span className="text-sm leading-4.75 font-bold text-gold group-hover:opacity-80">Read more</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    )
}
