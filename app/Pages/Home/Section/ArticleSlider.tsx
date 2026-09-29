"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { Article } from "@/app/lib/articles/types"
import ArticleCard from "./ArticleCard"

export default function ArticleSlider({ articles }: { articles: Article[] }) {
    return (
        <>
            <div className="max-[681px]:mx-auto max-[681px]:max-w-121.25">
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
