import { carSearchHref } from "@/app/lib/cars/search"
import { Article, ArticleBlock, ArticleCategory } from "./types"

// Sample articles used until the backend is connected. Only api.ts reads this file.

export const mockCategories: ArticleCategory[] = [
    { slug: "4x4-suv-reviews", name: "4x4/SUV Reviews" },
    { slug: "all-things-current", name: "All Things Current" },
    { slug: "atm-news", name: "ALL THINGS MOTORING News" },
    { slug: "atm-show", name: "ALL THINGS MOTORING Show" },
    { slug: "car-reviews", name: "Car Reviews" },
    { slug: "events", name: "Events" },
    { slug: "latest-launches", name: "Latest Launches" },
    { slug: "motor-matters", name: "Motor Matters" },
    { slug: "motoring-news", name: "Motoring News" },
    { slug: "retro-reviews", name: "RETRO REVIEWS" },
    { slug: "something-different", name: "Something Different" },
];

const placeholderBody: ArticleBlock[] = [
    { type: "paragraph", text: "This is sample article text. The full article will load from the backend once it is connected." },
];

function article(input: Omit<Article, "body"> & { body?: ArticleBlock[] }): Article {
    return { ...input, body: input.body ?? placeholderBody };
}

export const mockArticles: Article[] = [
    article({ slug: "road-review-mg-zs-pro", title: "Road Review - MG ZS Pro", publishedAt: "2026-09-28", category: "car-reviews", image: "/images/blogs/260928/20260912_060227.jpg", featured: true }),
    article({ slug: "jetour-payload-saga-continues", title: "Jetour payload saga continues", publishedAt: "2026-09-28", category: "all-things-current", image: "/images/blogs/260928/1800IMG_1307.jpeg" }),
    article({ slug: "jimny-gathering-venue-announced", title: "Jimny Gathering venue announced", publishedAt: "2026-09-28", category: "all-things-current", image: "/images/blogs/260928/Lowveld-2.jpg" }),
    article({ slug: "continental-expands-tyre-choice", title: "Continental expands tyre choice", publishedAt: "2026-09-25", category: "latest-launches", image: "/images/blogs/260925/3843SportContact7.jpeg", body: [
        { type: "paragraph", text: "Continental is broadening its range of ultra-high-performance tyres, those measuring 18 inches and above, and expects to add more than 650 new sizes across its tyre lines by the end of 2027. The expansion covers both original equipment fitments for new vehicles and the replacement market, and spans the core Continental brand along with secondary brands such as Semperit and Uniroyal." },
        { type: "paragraph", text: "The company says the move answers rising demand for tyres suited to larger, heavier and more powerful vehicles, including those with electrified drivetrains. Edwin Goudswaard, head of research and development for Continental's Tires group sector, says the enlarged range allows the company to offer customers more tailored solutions for safety, efficiency and driving dynamics." },
        { type: "paragraph", text: "High-performance tyres have taken on greater weight in Continental's passenger-car business in recent years. Between 2020 and 2025, their share of global passenger-car tyre sales across all brands climbed from 41% to 55%. The proportion reaches 70% in Asia-Pacific and 66% in the Americas, while in the EMEA region UHP tyres account for 43% of passenger-car tyre sales. For the Continental brand itself, the UHP share of global passenger-car tyre sales rose from about 49% in 2020 to roughly 62% in 2025." },
        { type: "image", src: "/images/blogs/content/kr4bEKutj0ms.jpeg" },
        { type: "link", text: "Safe and inexpensive cars for students - click here", href: carSearchHref({ collection: "student" }) },
        { type: "paragraph", text: "The shift towards larger tyres follows changes in the vehicle market. Cars have grown bigger, heavier and more powerful, with SUVs maintaining a long run of popularity. Electrification adds further mass through battery packs, while modern drivetrains produce torque levels once limited to high-performance sports cars." },
        { type: "paragraph", text: "These factors place greater demands on tyres, which must carry heavier loads while still delivering safety, efficiency and comfort. UHP tyres are designed to combine grip, short braking distances and precise handling with low rolling resistance and high mileage, and Continental develops them chiefly for wheel-and-tyre combinations of 18 inches and above, as well as for performance SUVs, premium sedans, sports cars and high-performance electric vehicles." },
        { type: "image", src: "/images/blogs/content/kQRjDcJL_Hr0.jpeg" },
        { type: "link", text: "Starting or expanding your business and in need of a bakkie – click here", href: carSearchHref({ collection: "bakkies" }) },
        { type: "paragraph", text: "Goudswaard notes as vehicles become larger, heavier and more powerful, tyres take on a more critical role. He describes them as more than the vehicle's connection to the road, calling them a prerequisite for safety, efficiency and driving dynamics. The UHP segment, he says, shows how capable modern tyres must be, with the difficulty lying in combining conflicting requirements at a high level." },
        { type: "paragraph", text: "The new sizes reflect a vehicle market that continues to diversify, with manufacturers offering models in more variants worldwide and requiring tyres matched to differing performance, efficiency and comfort needs." },
        { type: "paragraph", text: "Continental develops and tests UHP tyres through digital simulation, laboratory analysis, bench testing and driving tests across a range of temperatures, loads, speeds and road conditions. The High Performance Technology Center in Korbach serves as a hub for advancing manufacturing processes, and the findings feed into a global production network that builds UHP tyres up to 24 inches. Real-world testing takes place at tracks including the Contidrom near Hanover, as well as facilities in Arvidsjaur in Sweden and Uvalde in Texas, with attention on wet and dry braking, handling, high-speed capability, comfort and durability. The company also draws development input from tuning specialists ABT Sportsline and BRABUS, and from motorsport through its racing-tyre subsidiary Hoosier." },
        { type: "paragraph", text: "The SportContact 7 sits at the centre of Continental's UHP range and illustrates the performance of the portfolio. The summer tyre was developed for high-performance vehicles with combustion engines or electric motors and is available in sizes from 18 to 24 inches." },
        { type: "paragraph", text: "It has secured original-equipment approvals from manufacturers including Audi, BMW, BYD, Maserati, Mercedes-Benz, Polestar, Porsche, Volkswagen and Zeekr. Independent tests have also recognised its qualities: since launch, the SportContact 7 has placed in the top three in 27 of 29 international tyre tests, with reviewers pointing to short braking distances and balanced handling on dry and wet roads." },
        { type: "paragraph", text: "Colin Windell for Colin-on-Cars in association with" },
        { type: "paragraph", text: "proudly CHANGECARS" },
    ] }),
    article({ slug: "time-for-a-jac-black", title: "Time for a JAC Black", publishedAt: "2026-09-25", category: "latest-launches", image: "/images/blogs/260925/960T9BlackEditionLead.jpg" }),
    article({ slug: "road-review-omoda-c5-lux-x", title: "Road Review - Omoda C5 Lux X", publishedAt: "2026-09-24", category: "car-reviews", image: "/images/blogs/260924/Screenshot-2026-09-24-094107.png" }),
    article({ slug: "citroen-heads-for-the-outdoor", title: "Citroen heads for the Outdoor", publishedAt: "2026-09-23", category: "all-things-current", image: "/images/blogs/260923/009.jpg" }),
    article({ slug: "range-extender-from-icaur", title: "Range extender from iCAUR", publishedAt: "2026-09-22", category: "all-things-current", image: "/images/blogs/260922/icaur_south_africa_03t_reev_exterior-6-.jpg" }),
    article({ slug: "tektonic-moves-from-nissan", title: "Tekton(ic) moves from Nissan", publishedAt: "2026-09-22", category: "all-things-current", image: "/images/blogs/260922/202600921_NISSANTEKTONPRESS-31.jpg" }),
    article({ slug: "seven7-drive-gears-up", title: "Seven7 Drive gears up", publishedAt: "2026-09-20", category: "all-things-current", image: "/images/blogs/260920/Studio-5.jpeg" }),
    article({ slug: "apex-model-chery-tiggo-8", title: "Apex model Chery Tiggo 8", publishedAt: "2026-09-20", category: "latest-launches", image: "/images/blogs/260920/18002Image1.jpg" }),
    article({ slug: "real-growth-in-vehicle-sales", title: "Real growth in vehicle sales", publishedAt: "2026-09-18", category: "all-things-current", image: "/images/blogs/260918/21401.jpg" }),
    article({ slug: "new-outback-on-its-way", title: "New Outback on its way", publishedAt: "2026-09-18", category: "latest-launches", image: "/images/blogs/260918/18001Wilderness.jpg" }),
    article({ slug: "extended-service-from-jac", title: "Extended service from JAC", publishedAt: "2026-09-18", category: "all-things-current", image: "/images/blogs/260918/869JACT9.jpg" }),
    article({ slug: "free-armed-response-for-women", title: "Free armed response for women", publishedAt: "2026-09-17", category: "all-things-current", image: "/images/blogs/260917/1800AAWomen_Post1-2x-100.jpg" }),
    article({ slug: "first-drive-gwm-tank-500-and-p500-diesel", title: "First Drive - GWM Tank 500 and P500 diesel", publishedAt: "2026-09-17", category: "car-reviews", image: "/images/blogs/260917/18003.jpg" }),
    article({ slug: "road-review-toyota-rav4-gr-sport", title: "Road Review - Toyota RAV4 GR-Sport", publishedAt: "2026-09-15", category: "car-reviews", image: "/images/blogs/260915/2026-09-05-11.16.47.jpg" }),
    article({ slug: "the-connected-ecosystem", title: "The connected ecosystem", publishedAt: "2026-09-15", category: "all-things-current", image: "/images/blogs/260915/Citroen-2-.jpg" }),
    article({ slug: "changan-star-lcv-spread-launched", title: "Changan Star LCV spread launched", publishedAt: "2026-09-14", category: "latest-launches", image: "/images/blogs/260914/C3_05011.jpg" }),
    article({ slug: "hybrid-jaecoo-joins-lineup", title: "Hybrid Jaecoo joins lineup", publishedAt: "2026-09-14", category: "latest-launches", image: "/images/blogs/260914/1800jaecoo_j5_shs_studio_image-14-.jpg" }),
    article({ slug: "managing-rising-prices", title: "Managing rising prices", publishedAt: "2026-09-13", category: "all-things-current", image: "/images/blogs/260913/ChangeCars-Filling-up-2-.jpg" }),
];
