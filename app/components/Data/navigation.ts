import { carSearchHref } from "@/app/lib/cars/search"
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
            { label: "Articles", href: "/motoring-news" },
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
            { label: "Sell your vehicle", href: "/sell-your-vehicle" },
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
    { label: "Hot sellers", href: carSearchHref({ collection: "hot-sellers" }) },
    { label: "Student Cars", href: carSearchHref({ collection: "student" }) },
    { label: "Bakkies", href: carSearchHref({ collection: "bakkies" }) },
    { label: "Cheap Cars", href: carSearchHref({ collection: "cheap" }) },
    {
        label: "Spoil Yourself",
        children: [
            { label: "Classics", href: carSearchHref({ collection: "classics" }) },
            { label: "Exotics", href: carSearchHref({ collection: "exotics" }) },
            { label: "Leisure", href: carSearchHref({ collection: "leisure" }) },
        ],
    },
    { label: "Motorbikes", href: carSearchHref({ bodyType: "Motorbike" }) },
    { label: "Our Brands", href: `${site}/our-car-brands` },
    { label: "Our Dealers", href: `${site}/dealer-listing` },
];

export type DrawerLink = {
    href?: string
    action?: NavAction
    external?: boolean
}

export type DrawerSection = {
    icon: string
    links: DrawerLink[]
}

const atm = "https://www.allthingsmotoringinternational.com";

export const drawerSearch = { icon: "/img/mobile-menu/search.svg", href: carSearchHref({}) };

export const drawerSections: DrawerSection[] = [
    {
        icon: "/img/mobile-menu/buying.svg",
        links: [
            { href: carSearchHref({ collection: "bakkies" }) },
            { href: carSearchHref({ collection: "cheap" }) },
            { href: carSearchHref({ collection: "classics" }) },
            { href: carSearchHref({ collection: "exotics" }) },
            { href: carSearchHref({ collection: "hot-sellers" }) },
            { href: carSearchHref({ collection: "leisure" }) },
            { href: carSearchHref({ bodyType: "Motorbike" }) },
            { href: `${site}/specials` },
            { href: carSearchHref({ collection: "student" }) },
        ],
    },
    {
        icon: "/img/mobile-menu/selling.svg",
        links: [
            { href: `${site}/keep-it-or-changecars` },
            { href: "/sell-your-vehicle" },
            { href: `${site}/value-my-vehicle` },
        ],
    },
    {
        icon: "/img/mobile-menu/dealers.svg",
        links: [
            { href: `${site}/our-car-brands` },
            { href: `${site}/dealer-listing` },
            { action: "register" },
            { href: "/login" },
        ],
    },
    {
        icon: "/img/mobile-menu/advice.svg",
        links: [
            { href: `${atm}/articles/michaels-take-on-the-local-industry-and-its-products`, external: true },
            { href: `${site}/about-us` },
            { href: `${atm}/ask-mikey`, external: true },
            { href: `${site}/beat-my-quote` },
            { href: "https://newcars.changecars.co.za/", external: true },
            { href: `${site}/concierge-service` },
            { href: `${site}/ev-charging-stations` },
            { href: `${site}/help-me-find` },
            { href: `${atm}/motoring-advice`, external: true },
            { href: `${site}/new-vehicle-quote` },
        ],
    },
    {
        icon: "/img/mobile-menu/insurance.svg",
        links: [
            { href: `${site}/insurance/discovery-car-insurance` },
            { href: "https://screan.co.za/", action: "screan" },
            { href: `${site}/finance-calculator` },
        ],
    },
    {
        icon: "/img/mobile-menu/media.svg",
        links: [
            { href: `${atm}/`, external: true },
            { href: "/motoring-news" },
            { href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
            { href: `${site}/videos` },
            { href: `${atm}/your-experience-matters`, external: true },
        ],
    },
    {
        icon: "/img/mobile-menu/contact.svg",
        links: [
            { href: `${site}/contact-us` },
            { action: "newsletter" },
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
    { label: "Login", href: "/login", action: "login" },
];

export const footerColumns: NavLink[][] = [
    [
        { label: "BEAT-MY-QUOTE", href: `${site}/beat-my-quote` },
        { label: "Help Me Find", href: `${site}/help-me-find` },
        { label: "Keep It or CHANGECARS", href: `${site}/keep-it-or-changecars` },
        { label: "New Vehicle Quote", href: `${site}/new-vehicle-quote` },
        { label: "Sell Your Vehicle", href: "/sell-your-vehicle" },
        { label: "Finance", href: `${site}/insurance/discovery-car-insurance` },
        { label: "What Can I Afford", href: `${site}/finance-calculator` },
        { label: "Podcasts", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", external: true },
        { label: "Videos", href: `${site}/videos` },
    ],
    [
        { label: "Articles", href: "/motoring-news" },
        { label: "Classics", href: carSearchHref({ collection: "classics" }) },
        { label: "Concierge Service", href: `${site}/concierge-service` },
        { label: "Exotics", href: carSearchHref({ collection: "exotics" }) },
        { label: "Hot Sellers", href: carSearchHref({ collection: "hot-sellers" }) },
        { label: "Leisure", href: carSearchHref({ collection: "leisure" }) },
        { label: "Motorbikes", href: carSearchHref({ bodyType: "Motorbike" }) },
        { label: "Student Cars", href: carSearchHref({ collection: "student" }) },
        { label: "Your Bakkie Awaits", href: carSearchHref({ collection: "bakkies" }) },
    ],
    [
        { label: "Top Searches", href: carSearchHref({ collection: "hot-sellers" }) },
        { label: "Cars For Sale", href: carSearchHref({}) },
        { label: "Cheap Used Cars", href: carSearchHref({ collection: "cheap" }) },
        { label: "VW Used Cars", href: carSearchHref({ make: "volkswagen" }) },
        { label: "Toyota Used Cars", href: carSearchHref({ make: "toyota" }) },
        { label: "Gauteng Used Cars", href: carSearchHref({ province: "gauteng" }) },
        { label: "Automatic Cars", href: carSearchHref({ transmission: "Automatic" }) },
        {
            label: "Electric Cars",
            children: [
                { label: "Electric Cars", href: carSearchHref({ fuel: "Electric" }) },
                { label: "EV charging stations", href: `${site}/ev-charging-stations` },
            ],
        },
        { label: "Hybrid Cars", href: carSearchHref({ fuel: "Hybrid" }) },
    ],
];

export const socialLinks = [
    { label: "Follow us on Facebook", href: "https://www.facebook.com/CHANGECARS", icon: "/img/icon-footer-facebook.svg", width: 35 },
    { label: "Follow us on TikTok", href: "https://tiktok.com/@changecars", icon: "/img/tiktok.svg", width: 35 },
    { label: "Follow us on YouTube", href: "https://www.youtube.com/channel/UCZERPfVcd1TVgqtIucVgNwg", icon: "/img/ico_youtube.svg", width: 49.7 },
    { label: "Follow us on Instagram", href: "https://www.instagram.com/changecars_za/", icon: "/img/Instagram.svg", width: 35 },
    { label: "Follow us on Flipboard", href: "https://flipboard.com/@ChangeCars/", icon: "/img/flipboard.svg", width: 35 },
];
