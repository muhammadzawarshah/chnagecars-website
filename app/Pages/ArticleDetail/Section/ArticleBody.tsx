import Link from "next/link"
import { ArticleBlock } from "@/app/lib/articles/types"

export default function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {

    const text = "my-3.5 font-sans text-sm leading-5.25 text-[#2f2f2f]";

    return (
        <>
            <div>
                {blocks.map((block, index) => {
                    if (block.type === "heading") return <h2 key={index} className="mt-7 mb-3.5 font-sans text-lg leading-none font-black text-[#2f2f2f]">{block.text}</h2>;
                    if (block.type === "image") return <p key={index} className={text}><img src={block.src} alt={block.alt ?? ""} className="inline h-auto w-full py-6.75" /></p>;
                    if (block.type === "link") {
                        const internal = block.href.startsWith("/");
                        const className = "font-bold text-gold italic underline";
                        return (
                            <p key={index} className={text}>
                                {internal ? <Link href={block.href} className={className}>{block.text}</Link> : <a href={block.href} target="_blank" rel="noopener" className={className}>{block.text}</a>}
                            </p>
                        );
                    }
                    return <p key={index} className={text}>{block.text}</p>;
                })}
            </div>
        </>
    )
}
