import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { CarSearch, CarSearchResult, carSearchHref, collectionTitles } from "@/app/lib/cars/search"
import ListingCard from "./Section/ListingCard"
import SortMenu from "./Section/SortMenu"
import RefineSearch from "./Section/RefineSearch"
import MobileRefine from "./Section/MobileRefine"
import PremiumListings from "./Section/PremiumListings"

type CarListingProps = {
    search: CarSearch
    result: CarSearchResult<Car>
    premium: Car[]
    inventory: number
}

// Desktop: dark photo column on the left, grey results column to the right edge, both painted
// behind the site header like the live page. Below 1039px the search column becomes "Refine search".
export default function CarListing({ search, result, premium, inventory }: CarListingProps) {

    const pageLink = "flex h-9.75 min-w-9.75 items-center justify-center rounded-[5px] px-3 text-sm font-bold no-underline";
    const count = result.total.toLocaleString("en-US").replace(/,/g, " ");

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden bg-[url(/img/listing-bg.jpg)] bg-cover bg-top min-[1039px]:block">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-y-0 right-0 left-[calc(max(0px,(100%-1400px)/2)+466px)] bg-[#ccc]"></div>
            </div>

            <main className="relative z-1 bg-[#ccc] font-sans min-[1039px]:bg-transparent">
                <div className="mx-auto flex w-full max-w-350 min-[1039px]:px-5">
                    <aside className="hidden w-111.5 shrink-0 pt-5 pr-20.25 pb-25 min-[1039px]:block">
                        <div className="sticky top-5">
                            <RefineSearch key={JSON.stringify(search)} search={search} inventory={inventory} />
                            <a href="/sell-your-vehicle" className="mt-7 block">
                                <img src="/img/banners/cc-sell-your-vehicle.gif" alt="Sell Your Vehicle" className="block w-full" />
                            </a>
                        </div>
                    </aside>

                    <section className="min-h-300 min-w-0 flex-1 pb-20 min-[1039px]:px-10 min-[1039px]:pt-10">
                        <div className="mx-auto max-w-175 border-b border-dotted border-[#707070] px-5 py-4 min-[1039px]:max-w-none min-[1039px]:px-0 min-[1039px]:pt-5.5 min-[1039px]:pb-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-lg font-extrabold text-[#7c7c7c] min-[1100px]:text-xl">
                                <p className="m-0">{count} Results</p>
                                <h1 className="m-0 text-inherit">{search.collection ? collectionTitles[search.collection] : "New and Used Cars For Sale"}</h1>
                            </div>
                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
                                <Link href="/cars" className="text-base text-gold underline">Start new search</Link>
                                <div className="flex items-center gap-2.5">
                                    <MobileRefine search={search} inventory={inventory} />
                                    <SortMenu search={search} />
                                </div>
                            </div>
                        </div>

                        {premium.length > 0 && <PremiumListings cars={premium} />}

                        <ul className="m-0 list-none px-0 pt-10 max-[1038px]:px-5 min-[1039px]:pt-15">
                            {result.cars.map((car) => <ListingCard key={car.id} car={car} />)}
                            {result.cars.length === 0 && (
                                <li className="mx-auto max-w-175 bg-white px-5 py-7.5 text-center text-base shadow-[0_3px_6px_rgba(0,0,0,0.16)] min-[1039px]:max-w-none">
                                    No vehicles match this search yet.
                                    <Link href="/cars" className="mx-auto mt-7.5 block h-9.75 w-62.5 rounded-full border border-gold text-base leading-9.25 font-bold text-gold uppercase no-underline transition duration-300 hover:border-ink hover:bg-ink hover:text-white">Back to search</Link>
                                </li>
                            )}
                        </ul>

                        {result.pageCount > 1 && (
                            <nav aria-label="Pages" className="mt-2.5 flex justify-center gap-2">
                                {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((page) => (
                                    <Link key={page} href={carSearchHref({ ...search, page })} aria-current={page === result.page ? "page" : undefined} className={`${pageLink} ${page === result.page ? "bg-gold text-white" : "bg-white text-gold"}`}>{page}</Link>
                                ))}
                            </nav>
                        )}
                    </section>
                </div>
            </main>
        </>
    )
}
