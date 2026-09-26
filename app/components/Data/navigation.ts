import type { NavAction } from "../Popups/PopupContext"

const site = "https://www.changecars.co.za";

export type NavLink = {
    label: string
    href?: string
    action?: NavAction
    external?: boolean
    children?: NavLink[]
}

export type NavMenu = {
    label: string
    icon: string
    href?: string
    items?: NavLink[]
}

export const mainMenus: NavMenu[] = [
    {
        label: "Login",
        icon: "/img/login_icon.svg",
        items: [
            { label: "Login", action: "login" },
            { label: "Dealer registration", action: "register" },
        ],
    },
    {
        label: "Get in touch",
        icon: "/img/signup-icon.svg",
        items: [
            { label: "Contact", href: `${site}/contact-us` },
            { label: "Newsletter", action: "newsletter" },
            { label: "Share your story", href: "https://www.allthingsmotoringinternational.com/your-experience-matters", external: true },
        ],
    },
    {
        label: "Media",
        icon: "/img/media-icon.svg",
        items: [
            { label: "ALL THINGS MOTORING", href: "https://www.allthingsmotoringinternational.com/", external: true },
            { label: "Articles", href: `${site}/motoring-news` },
            { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
            { label: "Share your story", href: "https://www.allthingsmotoringinternational.com/your-experience-matters", external: true },
            { label: "Videos", href: `${site}/videos` },
        ],
    },
    {
        label: "Financial",
        icon: "/img/money-icon.svg",
        items: [
            { label: "Insurance", href: `${site}/insurance/discovery-car-insurance` },
            { label: "Price Index", href: `${site}/price-index` },
            { label: "What can I afford", href: `${site}/finance-calculator` },
        ],
    },
    {
        label: "Selling",
        icon: "/img/private-sellers/key-in-hand.svg",
        items: [
            { label: "Keep it or CHANGECARS", href: `${site}/keep-it-or-changecars` },
            { label: "Sell your vehicle", href: `${site}/sell-your-vehicle` },
            { label: "Value my vehicle", href: `${site}/value-my-vehicle` },
        ],
    },
    {
        label: "Buying",
        icon: "/img/wallet-icon.svg",
        items: [
            { label: "A-V of vehicles", href: "https://www.allthingsmotoringinternational.com/articles/michaels-take-on-the-local-industry-and-its-products", external: true },
            { label: "Ask MIKEY", href: "https://www.allthingsmotoringinternational.com/ask-mikey", external: true },
            { label: "BEAT-MY-QUOTE", href: `${site}/beat-my-quote` },
            { label: "Compare New Cars", href: "https://newcars.changecars.co.za/", external: true },
            { label: "Concierge Service", href: `${site}/concierge-service` },
            { label: "EV charging stations", href: `${site}/ev-charging-stations` },
            { label: "Help me find", href: `${site}/help-me-find` },
            { label: "Motoring advice", href: "https://www.allthingsmotoringinternational.com/motoring-advice", external: true },
            { label: "New vehicle quote", href: `${site}/new-vehicle-quote` },
            { label: "Reduced Price Vehicles", href: `${site}/` },
            { label: "Screan", href: "https://screan.co.za/", action: "screan" },
            { label: "Specials", href: `${site}/specials` },
            { label: "What can I afford", href: `${site}/finance-calculator` },
        ],
    },
    {
        label: "Concierge Service",
        icon: "/img/handshake-icon.svg",
        href: `${site}/concierge-service`,
    },
];

export const subNavLinks: NavLink[] = [
    { label: "Hot sellers", href: `${site}/hot-sellers` },
    { label: "Student Cars", href: `${site}/new-and-used-student-cars-for-sale` },
    { label: "Bakkies", href: `${site}/new-and-used-bakkies-for-sale` },
    { label: "Cheap Cars", href: `${site}/cheap-cars-for-sale` },
    {
        label: "Spoil Yourself",
        children: [
            { label: "Classics", href: `${site}/classics` },
            { label: "Exotics", href: `${site}/exotics` },
            { label: "Leisure", href: `${site}/leisure-vehicles` },
        ],
    },
    { label: "Motorbikes", href: `${site}/motorbikes` },
    { label: "Our Brands", href: `${site}/our-car-brands` },
    { label: "Our Dealers", href: `${site}/dealer-listing` },
];

export type MobileSection = {
    label: string
    icon: string
    items: NavLink[]
}

const atm = "https://www.allthingsmotoringinternational.com";

export const mobileSections: MobileSection[] = [
    {
        label: "Buying a vehicle",
        icon: "/img/mobile-menu/buying.svg",
        items: [
            { label: "Bakkies", href: `${site}/new-and-used-bakkies-for-sale` },
            { label: "Cheap Cars", href: `${site}/cheap-cars-for-sale` },
            { label: "Classics", href: `${site}/classics` },
            { label: "Exotics", href: `${site}/exotics` },
            { label: "Hot sellers", href: `${site}/hot-sellers` },
            { label: "Leisure", href: `${site}/leisure-vehicles` },
            { label: "Motorbikes", href: `${site}/motorbikes` },
            { label: "Reduced Price Vehicles", href: `${site}/` },
            { label: "Specials", href: `${site}/specials` },
            { label: "Student Cars", href: `${site}/new-and-used-student-cars-for-sale` },
        ],
    },
    {
        label: "Selling a vehicle",
        icon: "/img/mobile-menu/selling.svg",
        items: [
            { label: "Keep it or CHANGECARS", href: `${site}/keep-it-or-changecars` },
            { label: "Sell your vehicle", href: `${site}/sell-your-vehicle` },
            { label: "Value my vehicle", href: `${site}/value-my-vehicle` },
        ],
    },
    {
        label: "Dealers & Brands",
        icon: "/img/mobile-menu/dealers.svg",
        items: [
            { label: "Our Brands", href: `${site}/our-car-brands` },
            { label: "Our Dealers", href: `${site}/dealer-listing` },
            { label: "Dealer registration", action: "register" },
            { label: "Login", action: "login" },
        ],
    },
    {
        label: "Help, Quotes & Advice",
        icon: "/img/mobile-menu/advice.svg",
        items: [
            { label: "A-V of vehicles", href: `${atm}/articles/michaels-take-on-the-local-industry-and-its-products`, external: true },
            { label: "About us", href: `${site}/about-us` },
            { label: "Ask MIKEY", href: `${atm}/ask-mikey`, external: true },
            { label: "BEAT-MY-QUOTE", href: `${site}/beat-my-quote` },
            { label: "Compare New Cars", href: "https://newcars.changecars.co.za/", external: true },
            { label: "Concierge service", href: `${site}/concierge-service` },
            { label: "EV charging stations", href: `${site}/ev-charging-stations` },
            { label: "Help me find", href: `${site}/help-me-find` },
            { label: "Motoring advice", href: `${atm}/motoring-advice`, external: true },
            { label: "New vehicle quote", href: `${site}/new-vehicle-quote` },
            { label: "Price Index", href: `${site}/price-index` },
        ],
    },
    {
        label: "Insurance & Finance",
        icon: "/img/mobile-menu/insurance.svg",
        items: [
            { label: "Insurance", href: `${site}/insurance/discovery-car-insurance` },
            { label: "Price Index", href: `${site}/price-index` },
            { label: "Screan", href: "https://screan.co.za/", action: "screan" },
            { label: "What can I afford", href: `${site}/finance-calculator` },
        ],
    },
    {
        label: "Media",
        icon: "/img/mobile-menu/media.svg",
        items: [
            { label: "All Things Motoring", href: `${atm}/`, external: true },
            { label: "Articles", href: `${site}/motoring-news` },
            { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
            { label: "Share your story", href: `${atm}/your-experience-matters`, external: true },
            { label: "Videos", href: `${site}/videos` },
        ],
    },
    {
        label: "Get in touch",
        icon: "/img/mobile-menu/contact.svg",
        items: [
            { label: "Contact", href: `${site}/contact-us` },
            { label: "Newsletter signup", action: "newsletter" },
            { label: "Share your story", href: `${atm}/your-experience-matters`, external: true },
        ],
    },
];

export const footerInfoLinks: NavLink[] = [
    { label: "About This Site", href: `${site}/about-us` },
    { label: "ALL THINGS MOTORING", href: "https://www.allthingsmotoringinternational.com/", external: true },
    { label: "Price Index", href: `${site}/price-index` },
    { label: "Our Dealers", href: `${site}/dealer-listing` },
    { label: "Contact", href: `${site}/contact-us` },
    { label: "Our Brands", href: `${site}/our-car-brands` },
    { label: "Privacy Policy", href: `${site}/privacy_policy` },
    { label: "FAQ", href: `${site}/faqs` },
    { label: "Login", action: "login" },
];

export const footerColumns: NavLink[][] = [
    [
        { label: "BEAT-MY-QUOTE", href: `${site}/beat-my-quote` },
        { label: "Help Me Find", href: `${site}/help-me-find` },
        { label: "Keep It or CHANGECARS", href: `${site}/keep-it-or-changecars` },
        { label: "New Vehicle Quote", href: `${site}/new-vehicle-quote` },
        { label: "Sell Your Vehicle", href: `${site}/sell-your-vehicle` },
        { label: "Finance", href: `${site}/insurance/discovery-car-insurance` },
        { label: "What Can I Afford", href: `${site}/finance-calculator` },
        { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
        { label: "Videos", href: `${site}/videos` },
    ],
    [
        { label: "Articles", href: `${site}/motoring-news` },
        { label: "Classics", href: `${site}/classics` },
        { label: "Concierge Service", href: `${site}/concierge-service` },
        { label: "Exotics", href: `${site}/exotics` },
        { label: "Hot Sellers", href: `${site}/hot-sellers` },
        { label: "Leisure", href: `${site}/leisure-vehicles` },
        { label: "Motorbikes", href: `${site}/motorbikes` },
        { label: "Student Cars", href: `${site}/new-and-used-student-cars-for-sale` },
        { label: "Your Bakkie Awaits", href: `${site}/new-and-used-bakkies-for-sale` },
    ],
    [
        { label: "Top Searches", href: `${site}/hot-sellers` },
        { label: "Cars For Sale", href: `${site}/new-or-used-cars-for-sale` },
        { label: "Cheap Used Cars", href: `${site}/cheap-cars-for-sale` },
        { label: "VW Used Cars", href: `${site}/new-or-used-cars-for-sale/volkswagen` },
        { label: "Toyota Used Cars", href: `${site}/new-or-used-cars-for-sale/toyota` },
        { label: "Gauteng Used Cars", href: `${site}/new-or-used-cars-for-sale/gauteng` },
        { label: "Automatic Cars", href: `${site}/new-or-used-cars-for-sale?transmission=automatic` },
        {
            label: "Electric Cars",
            children: [
                { label: "Electric Cars", href: `${site}/new-or-used-cars-for-sale?fueltype=electric` },
                { label: "EV charging stations", href: `${site}/ev-charging-stations` },
            ],
        },
        { label: "Hybrid Cars", href: `${site}/new-or-used-cars-for-sale?fueltype=hybrid` },
    ],
];

export const socialLinks = [
    { label: "Follow us on Facebook", href: "https://www.facebook.com/CHANGECARS", icon: "/img/icon-footer-facebook.svg", width: 35 },
    { label: "Follow us on TikTok", href: "https://tiktok.com/@changecars", icon: "/img/tiktok.svg", width: 35 },
    { label: "Follow us on YouTube", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", icon: "/img/ico_youtube.svg", width: 49.7 },
    { label: "Follow us on Instagram", href: "https://www.instagram.com/changecars_za/", icon: "/img/Instagram.svg", width: 35 },
    { label: "Follow us on Flipboard", href: "https://flipboard.com/@ChangeCars/", icon: "/img/flipboard.svg", width: 35 },
];

export const mobileSocialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/changecars", icon: "/img/mobile-menu/facebook.svg", width: 20 },
    { label: "TikTok", href: "https://www.tiktok.com/@changecars", icon: "/img/mobile-menu/tiktok.svg", width: 20 },
    { label: "YouTube", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", icon: "/img/mobile-menu/youtube.svg", width: 29 },
    { label: "Instagram", href: "https://www.instagram.com/changecars_za", icon: "/img/mobile-menu/instagram.svg", width: 20 },
    { label: "Flipboard", href: "https://flipboard.com/@ChangeCars", icon: "/img/mobile-menu/flipboard.svg", width: 21 },
];
