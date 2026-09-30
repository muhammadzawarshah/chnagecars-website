"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { Article } from "@/app/lib/articles/types"
import ArticleCard from "./ArticleCard"

export default function ArticleSlider({ articles }: { articles: Article[] }) {
    return (
        <>
            <div className="-mx-2.5 max-[681px]:mr-0 max-[681px]:ml-[max(-0.625rem,calc((100%-30.3125rem)/2))] max-[681px]:w-[min(30.3125rem,calc(100%+1.25rem))]">
                <SwipeSlider
                    items={articles}
                    itemKey={(article) => article.slug}
                    slideClass="w-1/3 max-[1241px]:w-1/2 max-[681px]:w-full"
                    renderItem={(article) => <ArticleCard article={article} />}
                />
            </div>
        </>
    )
}
