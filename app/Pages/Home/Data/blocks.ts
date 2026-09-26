const site = "https://www.changecars.co.za";

export type ImageBlock = {
    title: string
    image: string
    href: string
}

export type Article = {
    title: string
    date: string
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
    { title: "Ultra Range Rover lands", date: "May 04, 2026", image: "/images/blogs/260504/RR_SV_Ultra_27MY_Exterior_02_290426.jpg", href: `${site}/blogs/ultra-range-rover-lands` },
    { title: "Road Review - Geely EX5", date: "April 29, 2026", image: "/images/blogs/260429/Geely-EX5-Ultra-Rainforest-Green-2.jpg", href: `${site}/blogs/road-review-geely-ex5` },
    { title: "Extreme economy testing", date: "April 29, 2026", image: "/images/blogs/260429/LCL_0706__11947288.jpg", href: `${site}/blogs/extreme-economy-testing` },
    { title: "Renault backs model idea", date: "April 29, 2026", image: "/images/blogs/260429/23535-lego-t3e-maison-renault-2.jpg", href: `${site}/blogs/renault-backs-model-idea` },
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
    { title: "OMODA Style X", image: "https://www.changecars.co.za/images/specials/260212/style-x.png", href: `${site}/specials/single/style-x` },
    { title: "GWM P300 LS", image: "https://www.changecars.co.za/images/specials/260203/gwm-p300-ls.png", href: `${site}/specials/single/p300-ls` },
    { title: "F-Series SBR 500 Special Edition", image: "/images/specials/260130/isuzu-2026.png", href: `${site}/specials/single/f-series-sbr-500-special-edition` },
    { title: "Tiggo 4 Cross ME", image: "https://www.changecars.co.za/images/specials/260212/tiggo-4.png", href: `${site}/specials/single/4-cross-me` },
    { title: "Alfa Romeo Junior Elettrica", image: "https://www.changecars.co.za/images/specials/260203/afla-2026.png", href: `${site}/specials/single/junior-elettrica` },
    { title: "Ford New Territory", image: "/images/specials/260130/Ford-new-terrioty.png", href: `${site}/specials/single/new-territory` },
    { title: "Haval Jolion City 1.5T", image: "/images/specials/260217/haval.png", href: `${site}/specials/single/haval-jolion-city-15t` },
    { title: "Jeep Gladiator", image: "/images/specials/260203/jeep-westvaal.png", href: `${site}/specials/single/gladiator` },
    { title: "Foton Tunland G7", image: "https://www.changecars.co.za/images/specials/260217/foton.png", href: `${site}/specials/single/foton-tunland-g7` },
    { title: "Omoda C5 Street", image: "/images/specials/260316/street-plus.png", href: `${site}/specials/single/omoda-c5-street` },
    { title: "Audi Q5 40 TDI quattro S", image: "https://www.changecars.co.za/images/specials/260212/Q5.png", href: `${site}/specials/single/q5-40-tdi-quattro-s-tronic-advanced` },
    { title: "Suzuki Fronx 1.5 GL 5MT", image: "/images/specials/260203/fronx.png", href: `${site}/specials/single/fronx-15-gl-5mt` },
];

export const ctas: Cta[] = [
    { title: "Sell your", highlight: "vehicle", description: ["We would love to buy your low mileage, excellent condition used vehicle"], image: "/img/sell-vehicle-cta-icon.png", href: `${site}/sell-your-vehicle` },
    { title: "Value my", highlight: "vehicle", description: ["Are you keen to find out what your vehicle is worth, we are here to assist"], image: "/img/value-cta-icon.png", href: `${site}/value-my-vehicle` },
    { title: "Beat my", highlight: "quote", description: ["We help ensure you get the best price and best service on your new vehicle purchase"], image: "/img/beat-my-quote-cta-icon.png", href: `${site}/beat-my-quote` },
    { title: "Keep it or", highlight: "changecars", description: ["We offer advice to help you make an informed decision as to whether it is time to CHANGECARS"], image: "/img/keep-it-cta-icon.png", href: `${site}/keep-it-or-changecars` },
    { title: "NEW", highlight: "CARS", description: ["Find the Car You Want.... Your Way!", "Then SIMPLY call for Quotations from Approved Dealers"], image: "/img/new-cars-cta-image.png", href: "https://newcars.changecars.co.za/", external: true },
    { title: "New vehicle", highlight: "quote", description: ["Let us know what it is that you are looking for and our team will do their best to assist"], image: "/img/new-vehicle-quote-image.png", href: `${site}/new-vehicle-quote` },
];
