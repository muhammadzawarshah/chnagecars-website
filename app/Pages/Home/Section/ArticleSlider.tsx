"use client"

import SwipeSlider from "../../../components/SwipeSlider"
import { articles } from "../Data/blocks"
import ArticleCard from "./ArticleCard"

export default function ArticleSlider() {
    return (
        <>
            <div className="mx-auto hidden max-w-121.25 max-[681px]:block">
                <SwipeSlider items={articles} itemKey={(article) => article.title} renderItem={(article) => <ArticleCard article={article} />} />
            </div>
        </>
    )
}
