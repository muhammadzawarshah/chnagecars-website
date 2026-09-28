"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { articles } from "../Data/blocks"
import ArticleCard from "./ArticleCard"

export default function ArticleSlider() {
    return (
        <>
            <div className="max-[681px]:mx-auto max-[681px]:max-w-121.25">
                <SwipeSlider
                    items={articles}
                    itemKey={(article) => article.title}
                    slideClass="w-1/3 max-[1241px]:w-1/2 max-[681px]:w-full"
                    renderItem={(article) => <ArticleCard article={article} />}
                />
            </div>
        </>
    )
}
