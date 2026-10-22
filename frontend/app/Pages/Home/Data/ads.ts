export type Ad = {
    href: string
    image: string
    alt: string
}

const standardBank = "https://www.standardbank.co.za/southafrica/personal/products-and-services/borrow-for-your-needs/vehicle-financing/see-financing-options";

export const heroAd: Ad = { href: standardBank, image: "/images/ad_banners/1/OI1fUnAvXKkl.gif", alt: "Standard Bank" };

export const dealersAd: Ad = { href: standardBank, image: "/images/ad_banners/2/YoGsRec3491O.gif", alt: "Standard Bank" };

export const bottomAd: Ad = { href: "https://www.allthingsmotoringinternational.com", image: "/images/ad_banners/3/NYTG_QtWvPmV.gif", alt: "ATMI" };
