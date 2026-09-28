import SectionTitle from "../../../components/SectionTitle"
import { articles } from "../Data/blocks"
import ArticleCard from "./ArticleCard"

export default function LatestArticles() {
    return (
        <>
            <section className="m-0 -mt-px bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto max-w-350 pt-25 pb-12.5 max-[901px]:pt-13.75">
                    <SectionTitle>Our Latest <span>Articles</span></SectionTitle>
                    <p className="mt-4 mb-20 text-center text-base leading-6.5 font-normal max-[901px]:mb-12.5 max-[768px]:text-lg">Latest Car News, Reviews and Advice</p>
                    <ul className="m-0 grid list-none grid-cols-4 gap-7.5 p-2.5 max-[1241px]:grid-cols-2 max-[681px]:mx-auto max-[681px]:max-w-121.25 max-[681px]:grid-cols-1">
                        {articles.map((article) => (
                            <li key={article.title} className="text-left">
                                <ArticleCard article={article} />
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    )
}
