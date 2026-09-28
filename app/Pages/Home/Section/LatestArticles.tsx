import SectionTitle from "../../../components/SectionTitle"
import ArticleSlider from "./ArticleSlider"

export default function LatestArticles() {
    return (
        <>
            <section className="m-0 -mt-px bg-white px-8.75 max-[401px]:px-3.75 max-[251px]:px-2.5">
                <div className="mx-auto max-w-350 pt-25 pb-12.5 max-[901px]:pt-13.75">
                    <SectionTitle>Our Latest <span>Articles</span></SectionTitle>
                    <p className="mt-4 mb-20 text-center text-base leading-6.5 font-normal max-[901px]:mb-12.5 max-[768px]:text-lg">Latest Car News, Reviews and Advice</p>
                    <ArticleSlider />
                    <a href="https://www.changecars.co.za/motoring-news" className="mx-auto mt-7.5 flex h-10 w-fit items-center rounded-[5px] bg-[#957e4e] px-6 text-base font-semibold text-white no-underline max-[601px]:mt-5 max-[601px]:h-7 max-[601px]:px-3.5 max-[601px]:text-[13px]">View All</a>
                </div>
            </section>
        </>
    )
}
