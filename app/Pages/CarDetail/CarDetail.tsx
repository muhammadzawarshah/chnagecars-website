import Link from "next/link"
import { Car } from "@/app/lib/cars/types"
import { PopularDealer } from "@/app/lib/cars/api"
import { Article } from "@/app/lib/articles/types"
import { articleHref, formatArticleDate } from "@/app/lib/articles/format"
import { carHref, formatKm, formatRand, monthlyPayment } from "@/app/lib/cars/format"
import { carSearchHref, slugify } from "@/app/lib/cars/search"
import ShareMenu from "../ArticleDetail/Section/ShareMenu"
import EnquiryForm from "./Section/EnquiryForm"
import ActionButton from "./Section/EnquireButton"
import DetailPopups from "./Section/DetailPopups"
import CarGallery from "./Section/CarGallery"
import SpecAccordion from "./Section/SpecAccordion"
import OpeningHours from "./Section/OpeningHours"
import DealerRating from "./Section/DealerRating"
import PremiumListing from "./Section/PremiumListing"
import ContactBar from "./Section/ContactBar"
import Breadcrumb from "./Section/Breadcrumb"

type CarDetailProps = {
    car: Car
    similarCars: Car[]
    articles: Article[]
    dealers: PopularDealer[]
    marketPrice?: number
}

const icon = "/img/car-detail/orig";

function daysListed(listedAt: string) {
    return Math.max(0, Math.floor((Date.now() - new Date(listedAt).getTime()) / 86400000));
}

export default function CarDetail({ car, similarCars, articles, dealers, marketPrice }: CarDetailProps) {

    const logo = car.dealer.logo ?? "/img/favicon.png";
    const address = car.dealer.address ?? car.location;
    const message = encodeURIComponent(`Hi, I'm interested in the ${car.title} on CHANGECARS.`);
    const whatsapp = `https://wa.me/27861248248?text=${message}`;
    const specs = [["icon-cal.svg", String(car.year)], ["icon-km.svg", formatKm(car.mileage, " ").toUpperCase()], ["icon-tran.svg", car.transmission], ["icon-fuel.svg", car.fuel]];

    const difference = marketPrice === undefined ? undefined : marketPrice - car.price;
    const differenceText = difference === undefined ? "" : `R${Math.abs(difference).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ")}`;
    const expectedMileage = Math.max(1, new Date().getFullYear() - car.year + 1) * 15000;
    const mileageAbove = car.mileage > expectedMileage;
    const days = daysListed(car.listedAt);
    const lifespan = days < 7 ? "7 days" : days < 45 ? "45 days" : `${days} days`;
    const views = car.views ?? 0;
    const enquiries = car.enquiries ?? 0;

    const gold = "h-10 rounded-[5px] bg-gold px-2.5 text-center text-sm leading-10 font-medium text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.07)]";
    const topButton = `${gold} w-[calc(33.333%-12px)] max-[1038px]:w-[calc(50%-5px)]`;
    const black = "flex h-10 items-center rounded-[5px] bg-black p-2.5 text-sm leading-[16.1px] text-white no-underline max-[1038px]:h-auto max-[1038px]:min-h-10 max-[1038px]:w-[calc(50%-5px)] max-[1038px]:justify-center max-[1038px]:text-center";
    const heading = "m-0 text-lg leading-6 font-semibold text-black";
    const boldHeading = "my-[18.72px] text-[18.72px] leading-[21.5px] font-bold text-black";
    const card = "min-h-58.75 bg-[#f5f5f5] p-5 [&_p]:my-2.5 [&_p]:text-[15px] [&_p]:leading-5 [&_p]:text-ink [&_span]:text-gold";
    const cardTitle = "mt-3 mb-3.75 text-lg leading-[20.7px] font-semibold text-black";
    const dealerButton = "flex h-10 items-center rounded-[5px] bg-gold px-1.75 font-sans text-sm text-white no-underline";

    const rating = <DealerRating dealer={car.dealer.name} />;

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[url(/img/listing-bg.jpg)] bg-cover bg-top">
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-y-0 right-0 left-[calc(max(0px,(100%-1400px)/2)+466px)] hidden bg-white min-[1039px]:block"></div>
            </div>

            <main className="relative z-1 pt-5 pb-15 font-sans min-[1039px]:pt-20 min-[1039px]:pb-0 min-[1112px]:pt-0">
                <div className="mx-auto flow-root w-full max-w-350 px-5">
                    <aside className="float-left ml-11.25 hidden w-90 pt-8.5 min-[1039px]:block">
                        <EnquiryForm title={car.title} dealer={car.dealer.name} logo={logo} />
                    </aside>

                    <section className="bg-white px-5 py-7.5 min-[1039px]:ml-111.5 min-[1039px]:px-10">
                        <Breadcrumb />

                        <div className="mb-3">
                            <div className="flex flex-wrap items-start py-2.5">
                                <h2 className="m-0 text-[32px] leading-9.75 font-black text-gold">{formatRand(car.price, " ")}</h2>
                                <ActionButton action="finance" className="relative ml-2.5 bg-transparent p-0 text-xl leading-9.75 font-black text-gold underline">
                                    {formatRand(monthlyPayment(car.price), " ")} pm
                                    <span className="absolute top-0 -right-3.5 size-3.5 rounded-full border border-[#957e4e] text-xs leading-3 font-black text-[#957e4e] no-underline">i</span>
                                </ActionButton>
                                <ShareMenu title={car.title} className="mt-1 ml-auto pl-3.75" />
                            </div>
                            <h1 className="m-0 mb-3.75 text-xl leading-5 font-bold text-ink">{car.title}</h1>
                            <div className="mb-2.5 flex w-[92%] flex-wrap gap-2.5 max-[1038px]:w-full">
                                <ActionButton action="enquiry" className={topButton}>Message Dealer</ActionButton>
                                <a href="tel:0861248248" className={topButton}>Call Dealer</a>
                                <a href={whatsapp} target="_blank" className={`${topButton} flex items-center justify-center`}>
                                    <img src={`${icon}/icon-whatsapp-logo-green-white.svg`} alt="" className="mr-1.5 size-6" />
                                    WhatsApp
                                </a>
                                <a href="https://screan.co.za/" target="_blank" className={topButton}>Screan It</a>
                                <a href="https://www.changecars.co.za/insurance/discovery-car-insurance" target="_blank" className={topButton}>Insurance</a>
                            </div>
                            <span className="mb-2.25 block border-t border-dotted border-[#7c7c7c]"></span>
                            <div className="flex items-start justify-between gap-5 max-[1038px]:block">
                                <ul className="m-0 flow-root w-90 list-none p-0 max-[1038px]:w-full">
                                    {specs.map(([file, label]) => (
                                        <li key={file} className="float-left mr-5.75 bg-position-[0_50%] bg-no-repeat pl-5 text-sm leading-[16.1px] font-bold text-[#7c7c7c] max-[1038px]:mr-0 max-[1038px]:mb-3 max-[1038px]:w-1/2" style={{ backgroundImage: `url(${icon}/${file})` }}>{label}</li>
                                    ))}
                                </ul>
                                <div className="-mt-3.75 flex w-79.5 shrink-0 items-start justify-between max-[1038px]:mt-0 max-[1038px]:w-full">
                                    <h3 className="mt-4.25 mb-2.5 text-[18.72px] leading-[21.528px]">
                                        <a href="#dealer-info" className="text-base leading-4.75 font-black text-black uppercase no-underline">{car.dealer.name}</a>
                                        <span className="mt-0.5 flex items-center text-base leading-5.25 font-normal text-ink uppercase">
                                            {car.location}
                                            <img src={`${icon}/dealer-rating-i.svg`} alt="" className="ml-1.25 size-3.75" />
                                        </span>
                                    </h3>
                                    <div className="mt-4.75">{rating}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5 max-[1038px]:mt-2.5">
                                <Link href={carSearchHref({ make: slugify(car.make) })} className={black}>Learn about {car.make}</Link>
                                <a href="#dealer-info" className={black}>Learn about this Dealer</a>
                                <a href="https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg" target="_blank" className={`${black} bg-[#0a0a0a] font-medium`}>Watch Review</a>
                                <a href="#all-you-need-to-know" className={`${black} bg-[#0a0a0a] font-medium shadow-[0_3px_6px_rgba(0,0,0,0.07)]`}>
                                    <img src={`${icon}/all-you-need-to-know-icon.svg`} alt="" className="mr-1.5 size-4.25" />
                                    All You Need to Know
                                </a>
                            </div>
                        </div>

                        <CarGallery compare={{ id: car.id, title: car.title, price: car.price, image: car.image, href: carHref(car) }} photos={car.gallery} photoCount={car.photoCount} title={car.title} />

                        <div className="mb-7 bg-[#f5f5f5] px-3.75 py-2.5">
                            <h3 className="m-0 mb-3.75 text-lg leading-6 font-semibold text-black">Additional Information</h3>
                            <p className="my-4 text-base leading-5 text-ink">{car.title} finished in {car.colour.toLowerCase()}, with a {car.engine} {car.fuel.toLowerCase()} engine, {car.transmission.toLowerCase()} transmission and {car.drive} drive. Contact the dealer for the full list of features and the service history of this vehicle.</p>
                        </div>

                        <div className="mb-6.5">
                            <h3 className={`${heading} mb-3.75`}>Technical specifications</h3>
                            <SpecAccordion groups={[
                                { icon: `${icon}/icon-general.svg`, title: "General", rows: [["Body Type", car.bodyType], ["Colour", car.colour], ["Year", String(car.year)], ["Mileage", formatKm(car.mileage, " ")]] },
                                { icon: `${icon}/icon-engine.svg`, title: "Engine", rows: [["Engine Capacity", car.engine], ["Fuel Type", car.fuel]] },
                                { icon: `${icon}/icon-handling.svg`, title: "Handling", rows: [["Transmission", car.transmission], ["Drive", car.drive]] },
                                { icon: `${icon}/icon-extra.svg`, title: "Extras", rows: [["Extras", "Contact the dealer"]] },
                                { icon: `${icon}/icon-calculator.svg`, title: "Finance Calculator", calculator: car.price },
                            ]} />
                        </div>

                        <p className="m-0 mb-6.75 text-sm leading-5 text-black"><strong className="text-base uppercase">Kindly Note:</strong> The data provided for this vehicle is supplied by the selling party. CHANGECARS is not responsible for any errors should they occur.</p>

                        <div id="dealer-info" className="relative bg-[#f5f5f5] p-6.25">
                            <div className="absolute -top-3 right-1.25">{rating}</div>
                            <div className="flex items-center">
                                <img src={logo} alt={car.dealer.name} className="size-22.5 bg-ink object-contain" />
                                <h3 className="my-6.75 ml-2.5 text-[27px] leading-[31px] font-normal text-gold">{car.dealer.name}</h3>
                            </div>
                            <div className="border-b border-black/50 py-5 text-base leading-[18.4px] text-black">
                                <Link href={carSearchHref({})} className="text-black no-underline">View Listings</Link>
                                <span className="mx-2.5 text-black/30">|</span>
                                <a href="#all-you-need-to-know" className="text-black no-underline">Learn More</a>
                            </div>
                            <div className="py-2.5">
                                <div className="flex min-h-17.25 items-center max-[600px]:flex-col max-[600px]:py-2.5">
                                    <h4 className="my-6 w-28.75 shrink-0 text-lg leading-[20.7px] font-normal text-black max-[600px]:my-2.5 max-[600px]:w-auto">Contact</h4>
                                    <div className="flex flex-wrap gap-1.25 max-[600px]:justify-center">
                                        <ActionButton action="enquiry" className={dealerButton}>Message Dealer</ActionButton>
                                        <a href="tel:0861248248" className={dealerButton}>Call Dealer</a>
                                        <a href={whatsapp} target="_blank" className={dealerButton}>
                                            <img src={`${icon}/icon-whatsapp-logo-green-white.svg`} alt="" className="mr-1.25 size-6" />
                                            WhatsApp
                                        </a>
                                        <OpeningHours hours={car.dealer.hours} />
                                    </div>
                                </div>
                                <div className="flex min-h-17.25 items-center max-[600px]:flex-col max-[600px]:py-2.5">
                                    <h4 className="my-6 w-28.75 shrink-0 text-lg leading-[20.7px] font-normal text-black max-[600px]:my-2.5 max-[600px]:w-auto">Visit us</h4>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" className="flex min-h-10 items-center rounded-[5px] px-1.75 text-sm leading-[16.1px] text-gold underline">
                                        <img src={`${icon}/icon-local.svg`} alt="" className="mr-3 h-4" />
                                        {address}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div id="all-you-need-to-know" className="mt-6.5 scroll-mt-5">
                            <h3 className={`${boldHeading} capitalize`}>All You Need to Know</h3>
                            <div className="grid grid-cols-3 gap-3.75 max-[1038px]:grid-cols-2 max-[600px]:grid-cols-1">
                                <div className={card}>
                                    <img src={`${icon}/all-you-need-to-know-price.svg`} alt="" className="inline h-6 align-baseline" />
                                    <h4 className={cardTitle}>Price</h4>
                                    {difference === undefined ? (
                                        <>
                                            <p>Market related price</p>
                                            <p>There are not enough similar vehicles listed yet to compare this price.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>{differenceText} {difference >= 0 ? "below" : "above"} market average</p>
                                            <p>This vehicle is <span>{differenceText}</span> {difference >= 0 ? "below" : "above"} market average, compared to vehicles of similar age and specification</p>
                                        </>
                                    )}
                                </div>
                                <div className={card}>
                                    <img src={`${icon}/all-you-need-to-know-mileage.svg`} alt="" className="inline h-6 align-baseline" />
                                    <h4 className={cardTitle}>Mileage</h4>
                                    <p>{mileageAbove ? "Above" : "Below"} market average</p>
                                    <p>This vehicle&apos;s mileage is <span>{mileageAbove ? "above" : "below"} average</span>, compared to vehicles of similar age and specification</p>
                                </div>
                                <div className={card}>
                                    <img src={`${icon}/all-you-need-to-know-listing-lifespan.svg`} alt="" className="inline h-6 align-baseline" />
                                    <h4 className={cardTitle}>Listing lifespan</h4>
                                    <p>{days < 45 ? `Less than ${lifespan}` : `Listed for ${lifespan}`}</p>
                                    <p>Vehicle has been listed with CHANGECARS for {days < 45 ? "less than " : ""}<span>{lifespan}</span></p>
                                </div>
                                <div className={card}>
                                    <img src={`${icon}/all-you-need-to-know-listing-views.svg`} alt="" className="inline h-6 align-baseline" />
                                    <h4 className={cardTitle}>Listing views</h4>
                                    <p>{views} views past 7 days</p>
                                    <p>This listing has had <span>{views} views</span> in the past <span>7 days</span></p>
                                </div>
                                <div className={card}>
                                    <img src={`${icon}/all-you-need-to-know-enquiries.svg`} alt="" className="inline h-6 align-baseline" />
                                    <h4 className={cardTitle}>Enquiries</h4>
                                    <p>{enquiries} enquiries past 7 days</p>
                                    <p>This listing has had <span>{enquiries} enquiries</span> in the past <span>7 days</span></p>
                                </div>
                                <div className={card}>
                                    <h4 className={`${cardTitle} mt-9.5`}>Interested?</h4>
                                    <ActionButton action="enquiry" className="rounded-[5px] bg-gold px-2.5 py-3 text-sm leading-[16.1px] font-medium text-white capitalize shadow-[0_3px_6px_rgba(0,0,0,0.07)]">Enquire about vehicle</ActionButton>
                                </div>
                            </div>
                        </div>

                        {articles.length > 0 && (
                            <div className="mt-6.5">
                                <h3 className={`${heading} mb-5`}>Articles related to the {car.make} {car.model} plus more</h3>
                                <ul className="m-0 grid list-none grid-cols-3 gap-5 p-0 pb-5 max-[1038px]:grid-cols-2 max-[600px]:grid-cols-1">
                                    {articles.map((article) => (
                                        <li key={article.slug} className="rounded-[5px] shadow-[5px_5px_15px_rgba(0,0,0,0.15)]">
                                            <Link href={articleHref(article)} className="block no-underline">
                                                <div className="h-46.75 rounded-t-[5px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${article.image})` }}></div>
                                                <div className="px-5 pt-5 pb-7.5">
                                                    <h3 className="m-0 mb-2.75 min-h-12 text-xl leading-6 font-bold text-ink">{article.title}</h3>
                                                    <p className="m-0 mb-7.5 text-sm leading-4.75 text-ink">{formatArticleDate(article.publishedAt)}</p>
                                                    <span className="text-sm leading-4.75 font-bold text-gold">Read more</span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {similarCars.length > 0 && <PremiumListing cars={similarCars} />}

                        {dealers.length > 0 && (
                            <div className="mt-12.5">
                                <h3 className={boldHeading}>Popular {car.make} {car.model} Dealers</h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {dealers.map(({ dealer, count }) => (
                                        <Link key={dealer.id} href={carSearchHref({ make: slugify(car.make), model: slugify(car.model) })} className="block w-[calc((100%-20px)/3)] no-underline shadow-[0_0_8px_rgba(0,0,0,0.16)] max-[600px]:w-full">
                                            <h4 className="m-0 h-8.75 truncate bg-gold px-3.75 text-center text-base leading-8.75 font-bold text-white">{dealer.name}</h4>
                                            <div className="h-37.5 bg-white bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${dealer.logo ?? "/img/site_logo_dark.svg"})`, backgroundSize: dealer.logo ? undefined : "60%" }}></div>
                                            <p className="m-0 h-7.5 bg-[#fefefe] px-2.5 text-center text-sm leading-7.5 text-gold">{count} Matching vehicles</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <ContactBar title={car.title} />
            <DetailPopups title={car.title} dealer={car.dealer.name} logo={logo} />
        </>
    )
}
