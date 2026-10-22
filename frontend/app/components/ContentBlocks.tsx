import Link from "next/link"
import type { ContentBlock } from "../lib/content/api"

// Information page text from the super admin console, rendered from structured blocks (never raw HTML).
export default function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
    const text = "my-3.5 font-sans text-base leading-7 text-[#2f2f2f]"
    return (
        <div className="max-w-215">
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "heading": return block.level === 3 || block.level === 4
                        ? <h3 key={index} className="mt-7 mb-3 font-sans text-lg font-black text-[#2f2f2f]">{block.text}</h3>
                        : <h2 key={index} className="mt-9 mb-3.5 font-sans text-2xl font-black text-[#2f2f2f]">{block.text}</h2>
                    case "list": return <ul key={index} className="my-3.5 list-disc pl-6 font-sans text-base leading-7 text-[#2f2f2f]">{block.items.filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</ul>
                    case "quote": return <blockquote key={index} className="my-5 border-l-4 border-gold bg-[#faf6ec] px-5 py-3 font-sans text-base leading-7 text-[#2f2f2f] italic">{block.text}</blockquote>
                    case "image": return <p key={index} className={text}><img src={block.src} alt={block.alt ?? ""} className="inline h-auto w-full rounded-md py-4" /></p>
                    case "video": return <p key={index} className={text}><a href={block.url} target="_blank" rel="noopener" className="font-bold text-gold underline">Watch the video</a></p>
                    case "link": return (
                        <p key={index} className={text}>
                            {block.href.startsWith("/") ? <Link href={block.href} className="font-bold text-gold underline">{block.text}</Link> : <a href={block.href} target="_blank" rel="noopener" className="font-bold text-gold underline">{block.text}</a>}
                        </p>
                    )
                    default: return <p key={index} className={`${text} whitespace-pre-line`}>{block.text}</p>
                }
            })}
        </div>
    )
}
