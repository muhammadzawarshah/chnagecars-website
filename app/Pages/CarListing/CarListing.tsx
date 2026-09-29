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

// Desktop: fixed search column on the dark photo, grey results column to the right edge.
// Below 1039px the search column becomes the "Refine search" drawer.
export default function CarListing({ search, result, premium, inventory }: CarListingProps) {

    const pageLink = "flex h-9.75 min-w-9.75 items-center justify-center rounded-[5px] px-3 text-sm font-bold no-underline";
    const count = result.total.toLocaleString("en-US").replace(/,/g, "");
    const title = search.collection ? collectionTitles[search.collection] : `New and Used ${search.bodyType ? `${search.bodyType} ` : ""}Cars For Sale`;
    const subject = search.collection ? collectionTitles[search.collection].replace(/ For Sale$/, "").toLowerCase() : `${search.bodyType ? `${search.bodyType} ` : ""}cars`;

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[url(/img/listing-bg.jpg)] bg-cover bg-top">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-y-0 right-0 left-[calc(max(0px,(100%-1400px)/2)+466px)] hidden bg-[#ccc] min-[1039px]:block"></div>
            </div>

            <main className="relative z-1 pt-[109px] font-sans min-[768px]:pt-[99px] min-[982px]:pt-32.5 min-[1039px]:pt-20 min-[1112px]:pt-0">
                <div className="mx-auto w-full max-w-350 px-5">
                    <aside className="fixed top-27 z-2 hidden w-95 pt-2.5 pr-3.75 max-[1111px]:top-8.75 max-[1111px]:pt-17 max-[1080px]:pt-18.5 min-[1039px]:block">
                        <RefineSearch key={JSON.stringify(search)} search={search} inventory={inventory} />
                        <a href="/sell-your-vehicle" className="mt-6.25 block">
                            <img src="/img/banners/cc-sell-your-vehicle.gif" alt="Sell Your Vehicle" className="block h-20.5 w-full" />
                        </a>
                    </aside>

                    <section className="min-h-300 bg-[#ccc] pb-20 min-[1039px]:ml-111.5 min-[1039px]:px-10 min-[1039px]:pt-5">
                        <div className="mx-auto max-w-175 border-b border-dotted border-[#707070] px-5 pt-14.5 pb-3.75 text-[#7c7c7c] min-[1039px]:max-w-none min-[1039px]:px-0 min-[1039px]:pt-10 min-[1039px]:pb-8.75">
                            <div className="flex h-10.25 items-start justify-between min-[1039px]:h-9.75 min-[1081px]:h-10.75 min-[1112px]:h-8.25">
                                <p className="m-0 mt-3 text-lg leading-[20.7px] font-extrabold max-[701px]:hidden min-[1039px]:mt-2 min-[1081px]:mt-2.5 min-[1081px]:text-xl min-[1081px]:leading-5.75 min-[1112px]:mt-0">{`${count} Results`}</p>
                                <h1 className="m-0 ml-auto text-right text-lg leading-[20.7px] font-extrabold text-inherit min-[1081px]:text-xl min-[1081px]:leading-5.75">
                                    <span className="min-[701px]:hidden">{count} </span>{title}
                                </h1>
                            </div>
                            <div className="relative h-4.5">
                                <Link href="/cars" className="absolute top-px left-0 text-sm leading-[16.1px] text-gold underline min-[1039px]:top-7 min-[1081px]:top-6.5">Start new search</Link>
                                <div className="absolute -top-2.25 right-0 z-10 min-[1039px]:-top-1.75 min-[1081px]:-top-2.25 min-[1112px]:top-1.5">
                                    <SortMenu search={search} />
                                </div>
                            </div>
                        </div>

                        <MobileRefine search={search} inventory={inventory} />

                        {premium.length > 0 && <PremiumListings cars={premium} />}

                        <p className="mx-auto mt-5.25 mb-[-15px] max-w-175 px-5 text-base leading-[18.4px] text-black min-[701px]:mt-8.25 min-[1039px]:mt-5 min-[1039px]:mb-[-10px] min-[1039px]:max-w-none min-[1039px]:px-0">
                            &quot;Browse new and used {subject} for sale from trusted dealers and private sellers across South Africa. Whether you need a practical family vehicle, a capable weekend adventurer or something with a little more luxury, CHANGECARS brings thousands of listings together in one place so you can compare prices, mileage and specifications side by side. Use the search filters to narrow things down by make, price, year and province, and find the right car for the way you drive. New stock is added every day, so check back often for the latest deals.&quot;
                        </p>

                        <ul className="m-0 list-none p-0 pt-10">
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
