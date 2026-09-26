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
        ],
    },
    {
        label: "Media",
        icon: "/img/media-icon.svg",
        items: [
            { label: "ALL THINGS MOTORING", href: "https://www.allthingsmotoringinternational.com/", external: true },
            { label: "Blog", href: `${site}/motoring-news` },
            { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
            { label: "Videos", href: `${site}/videos` },
        ],
    },
    {
        label: "Financial",
        icon: "/img/money-icon.svg",
        items: [
            { label: "Insurance", href: `${site}/insurance/car-and-warranty-solutions` },
            {
                label: "VAPSSA",
                children: [
                    { label: "Dealerships", href: `${site}/insurance/dealer-insurance` },
                    { label: "Private Individuals", href: `${site}/insurance/car-and-warranty-solutions` },
                ],
            },
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
            { label: "EV charging stations", href: `${site}/ev-charging-stations` },
            { label: "Help me find", href: `${site}/help-me-find` },
            { label: "Motoring advice", href: "https://www.allthingsmotoringinternational.com/motoring-advice", external: true },
            { label: "New vehicle quote", href: `${site}/new-vehicle-quote` },
            { label: "Private sales", href: `${site}/private-sales` },
            { label: "Screan", href: "https://screan.co.za/", action: "screan" },
            { label: "Specials", href: `${site}/specials` },
            { label: "What can I afford", href: `${site}/finance-calculator` },
        ],
    },
    {
        label: "Private Cars",
        icon: "/img/handshake-icon.svg",
        href: `${site}/private-sales`,
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

export const mobileLinks: NavLink[] = [
    { label: "A-V of vehicles", href: "https://www.allthingsmotoringinternational.com/articles/michaels-take-on-the-local-industry-and-its-products", external: true },
    { label: "About us", href: `${site}/about-us` },
    { label: "ALL THINGS MOTORING", href: "https://www.allthingsmotoringinternational.com/", external: true },
    { label: "Ask MIKEY", href: "https://www.allthingsmotoringinternational.com/ask-mikey", external: true },
    { label: "Bakkies", href: `${site}/new-and-used-bakkies-for-sale` },
    { label: "BEAT-MY-QUOTE", href: `${site}/beat-my-quote` },
    { label: "Blog", href: `${site}/blogs` },
    { label: "Cheap cars", href: `${site}/cheap-cars-for-sale` },
    { label: "Classics", href: `${site}/classics` },
    { label: "Compare new cars", href: "https://newcars.changecars.co.za/", external: true },
    { label: "EV charging stations", href: `${site}/ev-charging-stations` },
    { label: "Exotics", href: `${site}/exotics` },
    { label: "Help me find", href: `${site}/help-me-find` },
    { label: "Hot sellers", href: `${site}/hot-sellers` },
    { label: "Insurance", href: `${site}/insurance/car-and-warranty-solutions` },
    { label: "Keep it or CHANGECARS", href: `${site}/keep-it-or-changecars` },
    { label: "Leisure", href: `${site}/leisure-vehicles` },
    { label: "Mechanical Warranty", href: `${site}/insurance/car-and-warranty-solutions` },
    { label: "Motorbikes", href: `${site}/motorbikes` },
    { label: "Motoring advice", href: "https://www.allthingsmotoringinternational.com/motoring-advice", external: true },
    { label: "Newsletter signup", action: "newsletter" },
    { label: "New vehicle quote", href: `${site}/new-vehicle-quote` },
    { label: "Our brands", href: `${site}/our-car-brands` },
    { label: "Our dealers", href: `${site}/dealer-listing` },
    { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
    { label: "Private cars", href: `${site}/private-sales` },
    { label: "Screan", href: "https://screan.co.za/", action: "screan" },
    { label: "Sell your vehicle", href: `${site}/sell-your-vehicle` },
    { label: "Specials", href: `${site}/specials` },
    { label: "Student cars", href: `${site}/new-and-used-student-cars-for-sale` },
    { label: "Value my vehicle", href: `${site}/value-my-vehicle` },
    { label: "VAPSSA: Dealerships", href: `${site}/insurance/dealer-insurance` },
    { label: "VAPSSA: Private Individuals", href: `${site}/insurance/car-and-warranty-solutions` },
    { label: "Videos", href: `${site}/videos` },
    { label: "What can I afford", href: `${site}/finance-calculator` },
];

export const footerInfoLinks: NavLink[] = [
    { label: "About This Site", href: `${site}/about-us` },
    { label: "ALL THINGS MOTORING", href: "https://www.allthingsmotoringinternational.com/", external: true },
    { label: "SECONDS ONLINE", href: "https://www.secondsonline.co.za/", external: true },
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
        {
            label: "Financial",
            children: [
                { label: "VAPSSA: Dealerships", href: `${site}/insurance/dealer-insurance` },
                { label: "VAPSSA: Private Individuals", href: `${site}/insurance/car-and-warranty-solutions` },
            ],
        },
        { label: "What Can I Afford", href: `${site}/finance-calculator` },
        { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
        { label: "Videos", href: `${site}/videos` },
    ],
    [
        { label: "Blog", href: `${site}/motoring-news` },
        { label: "Classics", href: `${site}/classics` },
        { label: "Exotics", href: `${site}/exotics` },
        { label: "Hot Sellers", href: `${site}/hot-sellers` },
        { label: "Leisure", href: `${site}/leisure-vehicles` },
        { label: "Motorbikes", href: `${site}/motorbikes` },
        { label: "Private Cars", href: `${site}/private-sales` },
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
