import type { Metadata } from "next";
import Link from "next/link";
import InfoLayout from "@/app/components/InfoLayout";
import { getMedia, MediaItem } from "@/app/lib/content/api";

export const metadata: Metadata = {
  title: "Videos & Podcasts | CHANGECARS",
  description: "CHANGECARS motoring videos, reviews and podcast episodes.",
};

// YouTube links get YouTube's own thumbnail when none was uploaded.
function thumbnail(item: MediaItem) {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  const id = item.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "/img/articles-bg.jpg";
}

export default async function Page({ searchParams }: PageProps<"/videos">) {
  const page = Number((await searchParams).page) || 1;
  const media = await getMedia(page);
  return (
    <InfoLayout title="Videos &" highlight="Podcasts" intro="Road reviews, launches and motoring talk from the CHANGECARS team.">
      {media.items.length ? (
        <>
          <div className="grid grid-cols-3 gap-7.5 max-[1000px]:grid-cols-2 max-[600px]:grid-cols-1">
            {media.items.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noopener" className="group block overflow-hidden rounded-[10px] bg-cloud no-underline shadow-[5px_5px_5px_0px_rgba(0,0,0,0.149)]">
                <div className="relative aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${thumbnail(item)})` }}>
                  <span className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 font-sans text-xs font-bold text-white uppercase">{item.type === "PODCAST" ? "Podcast" : "Video"}</span>
                </div>
                <div className="px-5 py-4">
                  <h2 className="m-0 line-clamp-2 font-sans text-base font-bold text-[#2f2f2f] group-hover:text-gold">{item.title}</h2>
                  {item.description && <p className="m-0 mt-2 line-clamp-2 font-sans text-sm leading-5 text-slate">{item.description}</p>}
                </div>
              </a>
            ))}
          </div>
          {media.pageCount > 1 && (
            <div className="mt-10 flex justify-center gap-3 font-sans text-sm font-bold">
              {media.page > 1 && <Link href={`/videos?page=${media.page - 1}`} className="rounded-[5px] border border-gold px-4 py-2 text-gold no-underline">Previous</Link>}
              <span className="px-2 py-2 text-slate">Page {media.page} of {media.pageCount}</span>
              {media.page < media.pageCount && <Link href={`/videos?page=${media.page + 1}`} className="rounded-[5px] bg-gold px-4 py-2 text-white no-underline">Next</Link>}
            </div>
          )}
        </>
      ) : (
        <p className="font-sans text-base text-slate">New videos are on their way. Meanwhile, watch us on <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" rel="noopener" className="font-bold text-gold">YouTube</a>.</p>
      )}
    </InfoLayout>
  );
}
