import { Ref } from "react"
import { makes } from "../Data/makes"

const site = "https://www.changecars.co.za/new-or-used-cars-for-sale";

export default function QuickSearchList({ listRef }: { listRef?: Ref<HTMLUListElement> }) {

    const pill = "block cursor-pointer px-3.75 py-2.5 text-base text-coal no-underline";

    return (
        <ul ref={listRef} className="m-0 mr-3.75 flex shrink-0 list-none gap-3.75 p-0">
            <li className="shrink-0 rounded-[5px] border border-coal/28">
                <a href={`${site}/`} className={pill}>All <span className="font-bold text-gold">(36530)</span></a>
            </li>
            {makes.map((make, index) => (
                <li key={`${make.name}-${index}`} className="shrink-0 rounded-[5px] border border-coal/28">
                    <a href={`${site}/${make.slug}`} className={pill}>
                        {make.name} <span className="font-bold text-gold">({make.count})</span>
                    </a>
                </li>
            ))}
        </ul>
    )
}
