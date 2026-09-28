const site = "https://www.changecars.co.za";

export type ImageBlock = {
    title: string
    image: string
    href: string
}

export type Article = {
    title: string
    date: string
    excerpt?: string
    image: string
    href: string
}

export type CarType = {
    title: string
    description: string
    image: string
    href: string
}

export type Cta = {
    title: string
    highlight: string
    description: string[]
    image: string
    href: string
    external?: boolean
}

export const quickBlocks: ImageBlock[] = [
    { title: "ALMOST NEW", image: "/images/500/home_blocks/230914/audi.png", href: `${site}/new-or-used-cars-for-sale?mileage=30000` },
    { title: "BUDGET CARS UNDER R150 000", image: "/images/500/home_blocks/230909/small.jpg", href: `${site}/new-or-used-cars-for-sale?maxprice=150000` },
    { title: "CONVERTIBLES UNDER R400 000", image: "/images/500/home_blocks/230920/cc-c-class-cabriolet.jpeg", href: `${site}/new-or-used-cars-for-sale/convertible?maxprice=400000` },
    { title: "DOUBLE CABS UNDER R400 000", image: "/images/500/home_blocks/230908/volkswagen_laun.31f4e130108.original.jpg", href: `${site}/new-or-used-cars-for-sale/double-cab-bakkie?maxprice=400000` },
    { title: "EXOTICS UNDER R1 000 000", image: "/images/500/home_blocks/230909/exotic.jpg", href: `${site}/exotics` },
    { title: "HATCHBACKS UNDER R300 000", image: "/images/500/home_blocks/230914/yaris_1.jpg", href: `${site}/new-or-used-cars-for-sale/hatchback?maxprice=300000` },
    { title: "KIA UNDER 60 000KMS", image: "/images/500/home_blocks/230914/kia_1.jpg", href: `${site}/new-or-used-cars-for-sale/kia?mileage=60000` },
    { title: "MAZDA UNDER 60 000KMS", image: "/images/500/home_blocks/230914/mazda.jpg", href: `${site}/new-or-used-cars-for-sale/mazda?mileage=60000` },
    { title: "MOTORBIKES UNDER R150 000", image: "/images/500/home_blocks/230908/motorbike2.jpg", href: `${site}/motorbikes` },
    { title: "NISSAN UNDER 60 000KMS", image: "/images/500/home_blocks/230914/NISSAN.jpg", href: `${site}/new-or-used-cars-for-sale/nissan?mileage=60000` },
    { title: "SEDANS UNDER R200 000", image: "/images/500/home_blocks/230909/bmw8.jpg", href: `${site}/new-or-used-cars-for-sale/sedan?maxprice=200000` },
    { title: "SINGLE CABS UNDER R300 000", image: "/images/500/home_blocks/230909/single-cab5_1.jpeg", href: `${site}/new-or-used-cars-for-sale/single-cab-bakkie?maxprice=300000` },
    { title: "SUVS UNDER R500 000", image: "/images/500/home_blocks/230909/suv8.jpg", href: `${site}/new-or-used-cars-for-sale/suv?maxprice=500000` },
    { title: "TOYOTA UNDER 60 000KMS", image: "/images/500/home_blocks/230914/GR.jpg", href: `${site}/new-or-used-cars-for-sale/toyota?mileage=60000` },
    { title: "VOLKSWAGEN UNDER 80 000KMS", image: "/images/500/home_blocks/230914/vw1.jpg", href: `${site}/new-or-used-cars-for-sale/volkswagen?mileage=80000` },
];

export const articles: Article[] = [
    { title: "Continental expands tyre choice", date: "September 25, 2026", image: "/images/blogs/260925/3843SportContact7.jpeg", href: `${site}/blogs/continental-expands-tyre-choice` },
    { title: "Time for a JAC Black", date: "September 25, 2026", image: "/images/blogs/260925/960T9BlackEditionLead.jpg", href: `${site}/blogs/time-for-a-jac-black` },
    { title: "Road Review - Omoda C5 Lux X", date: "September 24, 2026", image: "/images/blogs/260924/Screenshot-2026-09-24-094107.png", href: `${site}/blogs/road-review-omoda-c5-lux-x` },
    { title: "Citroen heads for the Outdoor", date: "September 23, 2026", image: "/images/blogs/260923/009.jpg", href: `${site}/blogs/citroen-heads-for-the-outdoor` },
];

export const carTypes: CarType[] = [
    { title: "Super Cab", description: "Super cab bakkie", image: "/img/type-cars/super-cab.png", href: `${site}/new-or-used-cars-for-sale/extended-cab` },
    { title: "Hatchback", description: "Four door saloon with a tailgate", image: "/img/type-cars/hatchback.png", href: `${site}/new-or-used-cars-for-sale/hatchback` },
    { title: "Crossover", description: "Hatchback / SUV type vehicle with increased height", image: "/img/type-cars/crossover.png", href: `${site}/new-or-used-cars-for-sale/suv` },
    { title: "SUV", description: "Sport utility vehicle with four-wheel drive", image: "/img/type-cars/suv.png", href: `${site}/new-or-used-cars-for-sale/suv` },
    { title: "Coupé", description: "Two doors and stylish", image: "/img/type-cars/coupe.png", href: `${site}/new-or-used-cars-for-sale/coupe` },
    { title: "King Cab", description: "King cab bakkie", image: "/img/type-cars/toyota-xcab.png", href: `${site}/new-or-used-cars-for-sale/extended-cab` },
    { title: "Convertible", description: "Coupe style vehicle with retractable roof", image: "/img/type-cars/convertible.png", href: `${site}/new-or-used-cars-for-sale/convertible` },
    { title: "Half Ton", description: "Single cab bakkie with a 800kg load rating", image: "/img/type-cars/half-ton.png", href: `${site}/new-or-used-cars-for-sale/single-cab-bakkie` },
    { title: "Double Cab", description: "Double cab bakkie", image: "/img/type-cars/double-cab.png", href: `${site}/new-or-used-cars-for-sale/double-cab-bakkie` },
    { title: "Panel Van", description: "Cargo vehicle", image: "/img/type-cars/panel-van.png", href: `${site}/new-or-used-cars-for-sale/panel-van` },
    { title: "Extended Cab", description: "Extended cab bakkie", image: "/img/type-cars/xcab.png", href: `${site}/new-or-used-cars-for-sale/extended-cab` },
    { title: "Leisure", description: "Recreational item", image: "/img/type-cars/leisure.png", href: `${site}/leisure-vehicles` },
    { title: "Single Cab", description: "Single cab bakkie", image: "/img/type-cars/single-cab.png", href: `${site}/new-or-used-cars-for-sale/single-cab-bakkie` },
    { title: "Mini Bus", description: "A small bus ranging in capacity from 8 to 16 passengers", image: "/img/type-cars/mini-bus.png", href: `${site}/new-or-used-cars-for-sale/minibus` },
    { title: "Sedan", description: "Passenger vehicle with four doors", image: "/img/type-cars/sedan.png", href: `${site}/new-or-used-cars-for-sale/sedan` },
    { title: "X Cab", description: "X cab bakkie", image: "/img/type-cars/xcab-2.png", href: `${site}/new-or-used-cars-for-sale/extended-cab` },
];

export const specials: ImageBlock[] = [
    { title: "Truck Month", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-1-42648-1.jpg", href: `${site}/specials/single/truck-month` },
    { title: "Ranger XL 2.0 SIT Single/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-2-42648-1.jpg", href: `${site}/specials/single/the-ranger-xl-20-sit-singlec-x4-at` },
    { title: "Ranger Sport 3.0 V6 D/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-8-42648-1.jpg", href: `${site}/specials/single/ranger-sport-30-v6-dc-4x4-at` },
    { title: "Ranger XL 2.0 SIT D/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-6-42648-1.jpg", href: `${site}/specials/single/ranger-xl-20-sit-dc-4x4-at` },
    { title: "Suzuki S-Presso GL+ MT", image: "/images/specials/260909/suzuki-gl.png", href: `${site}/specials/single/suzuki-s-presso-gl-mt` },
    { title: "Omoda C7 Luxury", image: "/images/specials/260910/c7.png", href: `${site}/specials/single/omoda-c7-luxury` },
    { title: "Ranger Sport 3.0 V6 SUP/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-4-42648-1.jpg", href: `${site}/specials/single/ranger-sport-30-v6-supc-4x4-at` },
    { title: "Geely E2 Aspire", image: "/images/specials/260917/geely-e2.png", href: `${site}/specials/single/geely-e2-aspire` },
    { title: "Ranger Wildtrak 3.0 v6 SUP/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-5-42648-1.jpg", href: `${site}/specials/single/ranger-wildtrak-30-v6-supc-4x4-at` },
    { title: "All new Mazda CX-5 Individual 2.5L AT", image: "/images/specials/260910/mazda-cx5.png", href: `${site}/specials/single/all-new-mazda-cx-5-individual-25l-at` },
    { title: "Ranger XL 2.0 SIT SUP/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-3-42648-1.jpg", href: `${site}/specials/single/ranger-xl-20-sit-supc-4x4-at` },
    { title: "Ranger XLT 2.0 SIT D/C 4x4 AT", image: "/images/specials/260908/Human-Auto-Bloemfontein-Ford-42648-7-42648-1.jpg", href: `${site}/specials/single/ranger-xlt-20-sit-dc-4x4-at` },
];

export const ctas: Cta[] = [
    { title: "Sell your", highlight: "vehicle", description: ["We would love to buy your low mileage, excellent condition used vehicle"], image: "/img/sell-vehicle-cta-icon.png", href: `${site}/sell-your-vehicle` },
    { title: "Value my", highlight: "vehicle", description: ["Are you keen to find out what your vehicle is worth, we are here to assist"], image: "/img/value-cta-icon.png", href: `${site}/value-my-vehicle` },
    { title: "Beat my", highlight: "quote", description: ["We help ensure you get the best price and best service on your new vehicle purchase"], image: "/img/beat-my-quote-cta-icon.png", href: `${site}/beat-my-quote` },
    { title: "Keep it or", highlight: "changecars", description: ["We offer advice to help you make an informed decision as to whether it is time to CHANGECARS"], image: "/img/keep-it-cta-icon.png", href: `${site}/keep-it-or-changecars` },
    { title: "NEW", highlight: "CARS", description: ["Find the Car You Want.... Your Way!", "Then SIMPLY call for Quotations from Approved Dealers"], image: "/img/new-cars-cta-image.png", href: "https://newcars.changecars.co.za/", external: true },
    { title: "New vehicle", highlight: "quote", description: ["Let us know what it is that you are looking for and our team will do their best to assist"], image: "/img/new-vehicle-quote-image.png", href: `${site}/new-vehicle-quote` },
];
